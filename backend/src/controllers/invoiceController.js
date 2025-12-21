import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceItems,
  deleteInvoice,
  verifyClientOwnership,
} from '../queries/invoices.js';
import { getInvoicePrefix } from '../queries/settings.js';
import { generateInvoiceNumber } from '../utils/numbering.js';
import { query } from '../config/database.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';

/**
 * Get list of invoices
 * GET /api/v1/invoices
 */
export const listInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      status: req.query.status || 'all',
      clientId: req.query.clientId ? parseInt(req.query.clientId) : null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getInvoices(userId, filters);

    // Transform invoices
    const transformedInvoices = result.invoices.map(i => {
      const transformed = toCamelCase(i);
      transformed.clientName = i.client_name;
      return transformed;
    });

    return successResponse(
      res,
      {
        invoices: transformedInvoices,
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List invoices error:', error);
    throw error;
  }
};

/**
 * Get invoice by ID
 * GET /api/v1/invoices/:id
 */
export const getInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid invoice ID',
        null,
        400
      );
    }

    const invoice = await getInvoiceById(userId, invoiceId);

    if (!invoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }

    // Transform invoice
    const transformed = toCamelCase(invoice);
    transformed.client = {
      id: invoice.client_id,
      name: invoice.client_name,
      email: invoice.client_email,
    };
    transformed.items = toCamelCaseArray(invoice.items || []);
    transformed.payments = toCamelCaseArray(invoice.payments || []);

    return successResponse(
      res,
      {
        invoice: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get invoice error:', error);
    throw error;
  }
};

/**
 * Create new invoice
 * POST /api/v1/invoices
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      clientId,
      issueDate,
      dueDate,
      notes,
      terms,
      status = 'draft',
      items,
    } = req.body;

    // Validation
    if (!clientId) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Client ID is required',
        { clientId: ['Client ID is required'] },
        422
      );
    }

    if (!issueDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Issue date is required',
        { issueDate: ['Issue date is required'] },
        422
      );
    }

    if (!dueDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Due date is required',
        { dueDate: ['Due date is required'] },
        422
      );
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Due date must be >= issue date',
        { dueDate: ['Due date must be >= issue date'] },
        422
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'At least one line item is required',
        { items: ['At least one line item is required'] },
        422
      );
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: [`Status must be one of: ${validStatuses.join(', ')}`] },
        422
      );
    }

    // Verify client ownership
    const clientExists = await verifyClientOwnership(userId, clientId);
    if (!clientExists) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Client not found',
        null,
        404
      );
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || item.name.trim().length === 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          `Item ${i + 1}: Name is required`,
          { [`items[${i}].name`]: ['Name is required'] },
          422
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          `Item ${i + 1}: Quantity must be > 0`,
          { [`items[${i}].quantity`]: ['Quantity must be > 0'] },
          422
        );
      }
      if (item.price === undefined || item.price < 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          `Item ${i + 1}: Price must be >= 0`,
          { [`items[${i}].price`]: ['Price must be >= 0'] },
          422
        );
      }
      if (item.discountPercent < 0 || item.discountPercent > 100) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          `Item ${i + 1}: Discount percent must be 0-100`,
          { [`items[${i}].discountPercent`]: ['Discount percent must be 0-100'] },
          422
        );
      }
      if (item.taxPercent < 0 || item.taxPercent > 100) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          `Item ${i + 1}: Tax percent must be 0-100`,
          { [`items[${i}].taxPercent`]: ['Tax percent must be 0-100'] },
          422
        );
      }
    }

    // Get invoice prefix and generate number
    const prefix = await getInvoicePrefix(userId);
    const invoiceNumber = await generateInvoiceNumber(userId, prefix, query);

    // Create invoice with line items
    const invoice = await createInvoice(
      userId,
      {
        clientId,
        issueDate,
        dueDate,
        notes,
        terms,
        status,
      },
      items,
      invoiceNumber
    );

    // Transform response
    const transformed = toCamelCase(invoice);
    transformed.client = {
      id: invoice.client_id,
      name: invoice.client_name,
      email: invoice.client_email,
    };
    transformed.items = toCamelCaseArray(invoice.items || []);
    transformed.payments = toCamelCaseArray(invoice.payments || []);

    return successResponse(
      res,
      {
        invoice: transformed,
      },
      'Invoice created successfully',
      201
    );
  } catch (error) {
    console.error('Create invoice error:', error);
    throw error;
  }
};

/**
 * Update invoice
 * PUT /api/v1/invoices/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid invoice ID',
        null,
        400
      );
    }

    // Check if invoice exists
    const existingInvoice = await getInvoiceById(userId, invoiceId);
    if (!existingInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }

    const {
      clientId,
      issueDate,
      dueDate,
      notes,
      terms,
      status,
      items,
    } = req.body;

    // Validation
    if (issueDate && dueDate && new Date(dueDate) < new Date(issueDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Due date must be >= issue date',
        { dueDate: ['Due date must be >= issue date'] },
        422
      );
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue'];
      if (!validStatuses.includes(status)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Invalid status value',
          { status: [`Status must be one of: ${validStatuses.join(', ')}`] },
          422
        );
      }
    }

    // Verify client ownership if clientId is being updated
    if (clientId !== undefined) {
      const clientExists = await verifyClientOwnership(userId, clientId);
      if (!clientExists) {
        return errorResponse(
          res,
          'NOT_FOUND',
          'Client not found',
          null,
          404
        );
      }
    }

    // Validate line items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'At least one line item is required',
          { items: ['At least one line item is required'] },
          422
        );
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || item.name.trim().length === 0) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            `Item ${i + 1}: Name is required`,
            { [`items[${i}].name`]: ['Name is required'] },
            422
          );
        }
        if (!item.quantity || item.quantity <= 0) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            `Item ${i + 1}: Quantity must be > 0`,
            { [`items[${i}].quantity`]: ['Quantity must be > 0'] },
            422
          );
        }
        if (item.price === undefined || item.price < 0) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            `Item ${i + 1}: Price must be >= 0`,
            { [`items[${i}].price`]: ['Price must be >= 0'] },
            422
          );
        }
      }
    }

    // Update invoice fields
    const updatedInvoice = await updateInvoice(userId, invoiceId, {
      clientId,
      issueDate,
      dueDate,
      notes,
      terms,
      status,
    });

    if (!updatedInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }

    // Update line items if provided
    if (items !== undefined) {
      await updateInvoiceItems(userId, invoiceId, items);
      // Get updated invoice with new items
      const fullInvoice = await getInvoiceById(userId, invoiceId);
      
      // Transform response
      const transformed = toCamelCase(fullInvoice);
      transformed.client = {
        id: fullInvoice.client_id,
        name: fullInvoice.client_name,
        email: fullInvoice.client_email,
      };
      transformed.items = toCamelCaseArray(fullInvoice.items || []);
      transformed.payments = toCamelCaseArray(fullInvoice.payments || []);

      return successResponse(
        res,
        {
          invoice: transformed,
        },
        'Invoice updated successfully',
        200
      );
    }

    // Transform response
    const transformed = toCamelCase(updatedInvoice);
    transformed.client = {
      id: updatedInvoice.client_id,
      name: updatedInvoice.client_name,
      email: updatedInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(updatedInvoice.items || []);
    transformed.payments = toCamelCaseArray(updatedInvoice.payments || []);

    return successResponse(
      res,
      {
        invoice: transformed,
      },
      'Invoice updated successfully',
      200
    );
  } catch (error) {
    console.error('Update invoice error:', error);
    throw error;
  }
};

/**
 * Delete invoice
 * DELETE /api/v1/invoices/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid invoice ID',
        null,
        400
      );
    }

    // Check if invoice exists
    const existingInvoice = await getInvoiceById(userId, invoiceId);
    if (!existingInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }

    await deleteInvoice(userId, invoiceId);

    return successResponse(
      res,
      null,
      'Invoice deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete invoice error:', error);
    throw error;
  }
};


