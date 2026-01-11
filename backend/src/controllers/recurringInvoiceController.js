import {
  getRecurringInvoices,
  getRecurringInvoiceById,
  createRecurringInvoice,
  updateRecurringInvoice,
  updateRecurringInvoiceItems,
  deleteRecurringInvoice,
  startRecurringInvoice,
  stopRecurringInvoice,
  getGeneratedInvoices,
  verifyClientOwnership,
} from '../queries/recurringInvoices.js';
import { generateSchedule, prepareInvoiceData } from '../utils/recurringInvoiceGenerator.js';
import { createInvoice } from '../queries/invoices.js';
import { getInvoicePrefix } from '../queries/settings.js';
import { generateInvoiceNumber } from '../utils/numbering.js';
import { query } from '../config/database.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';
import { validateCurrencyCode } from '../utils/currency.js';
import { getSettings } from '../queries/settings.js';

/**
 * Get list of recurring invoices
 * GET /api/v1/recurring-invoices
 */
export const listRecurringInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      status: req.query.status || 'all',
      clientId: req.query.clientId ? parseInt(req.query.clientId) : null,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getRecurringInvoices(userId, filters);

    // Transform recurring invoices
    const transformedRecurringInvoices = result.recurringInvoices.map(ri => {
      const transformed = toCamelCase(ri);
      transformed.clientName = ri.client_name;
      return transformed;
    });

    return successResponse(
      res,
      {
        recurringInvoices: transformedRecurringInvoices,
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List recurring invoices error:', error);
    throw error;
  }
};

/**
 * Get recurring invoice by ID
 * GET /api/v1/recurring-invoices/:id
 */
export const getRecurringInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    const recurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);

    if (!recurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    // Transform recurring invoice
    const transformed = toCamelCase(recurringInvoice);
    transformed.client = {
      id: recurringInvoice.client_id,
      name: recurringInvoice.client_name,
      email: recurringInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(recurringInvoice.items || []);

    return successResponse(
      res,
      {
        recurringInvoice: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get recurring invoice error:', error);
    throw error;
  }
};

/**
 * Create new recurring invoice
 * POST /api/v1/recurring-invoices
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      clientId,
      frequency,
      startDate,
      endDate,
      dueDateDays,
      autoBill = 'disabled',
      notes,
      terms,
      items,
      currency,
      exchangeRate,
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

    if (!frequency || !['daily', 'weekly', 'monthly', 'quarterly', 'annually'].includes(frequency)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid frequency is required (daily, weekly, monthly, quarterly, annually)',
        { frequency: ['Frequency is required'] },
        422
      );
    }

    if (!startDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Start date is required',
        { startDate: ['Start date is required'] },
        422
      );
    }

    if (!endDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'End date is required',
        { endDate: ['End date is required'] },
        422
      );
    }

    if (new Date(endDate) < new Date(startDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'End date must be >= start date',
        { endDate: ['End date must be >= start date'] },
        422
      );
    }

    if (!dueDateDays || dueDateDays < 1 || dueDateDays > 30) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Due date days must be between 1 and 30',
        { dueDateDays: ['Due date days must be 1-30'] },
        422
      );
    }

    if (!['disabled', 'enabled', 'opt_in'].includes(autoBill)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Auto bill must be disabled, enabled, or opt_in',
        { autoBill: ['Invalid auto bill value'] },
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

    // Get company settings for default currency and base currency
    const settings = await getSettings(userId);
    const defaultCurrency = settings?.currency || 'MVR';
    const baseCurrency = settings?.base_currency || 'USD';
    const documentCurrency = currency || defaultCurrency;

    // Validate currency code
    if (documentCurrency && !validateCurrencyCode(documentCurrency)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid currency code (must be ISO 4217 format: 3 uppercase letters)',
        { currency: ['Invalid currency code'] },
        422
      );
    }

    // Validate exchange rate
    if (documentCurrency !== baseCurrency) {
      if (!exchangeRate || exchangeRate <= 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Exchange rate is required when currency differs from base currency',
          { exchangeRate: ['Exchange rate must be > 0 when currency ≠ base currency'] },
          422
        );
      }
    } else {
      if (exchangeRate !== undefined && exchangeRate !== null) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Exchange rate should not be provided when currency is base currency',
          { exchangeRate: ['Exchange rate should be null when currency is base currency'] },
          422
        );
      }
    }

    // Create recurring invoice with line items
    const recurringInvoice = await createRecurringInvoice(
      userId,
      {
        clientId,
        frequency,
        startDate,
        endDate,
        dueDateDays,
        autoBill,
        notes,
        terms,
        currency: documentCurrency,
        exchangeRate: documentCurrency !== baseCurrency ? exchangeRate : null,
      },
      items
    );

    // Transform response
    const transformed = toCamelCase(recurringInvoice);
    transformed.client = {
      id: recurringInvoice.client_id,
      name: recurringInvoice.client_name,
      email: recurringInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(recurringInvoice.items || []);

    return successResponse(
      res,
      {
        recurringInvoice: transformed,
      },
      'Recurring invoice created successfully',
      201
    );
  } catch (error) {
    console.error('Create recurring invoice error:', error);
    throw error;
  }
};

/**
 * Update recurring invoice
 * PUT /api/v1/recurring-invoices/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    // Check if recurring invoice exists
    const existingRecurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);
    if (!existingRecurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    const {
      clientId,
      frequency,
      startDate,
      endDate,
      dueDateDays,
      autoBill,
      notes,
      terms,
      items,
      currency,
      exchangeRate,
    } = req.body;

    // Validation
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'End date must be >= start date',
        { endDate: ['End date must be >= start date'] },
        422
      );
    }

    if (frequency && !['daily', 'weekly', 'monthly', 'quarterly', 'annually'].includes(frequency)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid frequency value',
        { frequency: ['Frequency must be one of: daily, weekly, monthly, quarterly, annually'] },
        422
      );
    }

    if (dueDateDays !== undefined && (dueDateDays < 1 || dueDateDays > 30)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Due date days must be between 1 and 30',
        { dueDateDays: ['Due date days must be 1-30'] },
        422
      );
    }

    if (autoBill && !['disabled', 'enabled', 'opt_in'].includes(autoBill)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Auto bill must be disabled, enabled, or opt_in',
        { autoBill: ['Invalid auto bill value'] },
        422
      );
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

    // Validate currency if provided
    if (currency !== undefined) {
      if (!validateCurrencyCode(currency)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Invalid currency code (must be ISO 4217 format: 3 uppercase letters)',
          { currency: ['Invalid currency code'] },
          422
        );
      }

      // Get company settings for base currency
      const settings = await getSettings(userId);
      const baseCurrency = settings?.base_currency || 'USD';

      // Validate exchange rate
      if (currency !== baseCurrency) {
        if (exchangeRate === undefined || exchangeRate === null || exchangeRate <= 0) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            'Exchange rate is required when currency differs from base currency',
            { exchangeRate: ['Exchange rate must be > 0 when currency ≠ base currency'] },
            422
          );
        }
      } else {
        if (exchangeRate !== undefined && exchangeRate !== null) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            'Exchange rate should not be provided when currency is base currency',
            { exchangeRate: ['Exchange rate should be null when currency is base currency'] },
            422
          );
        }
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

    // Prepare currency and exchange rate for update
    const settings = await getSettings(userId);
    const baseCurrency = settings?.base_currency || 'USD';
    let finalCurrency = currency !== undefined ? currency : existingRecurringInvoice.currency;
    let finalExchangeRate = exchangeRate !== undefined ? exchangeRate : existingRecurringInvoice.exchange_rate;

    // If currency changed, recalculate exchange rate requirement
    if (currency !== undefined) {
      if (currency === baseCurrency) {
        finalExchangeRate = null;
      } else if (exchangeRate === undefined) {
        if (existingRecurringInvoice.currency === baseCurrency) {
          if (finalExchangeRate === null || finalExchangeRate <= 0) {
            return errorResponse(
              res,
              'VALIDATION_ERROR',
              'Exchange rate is required when currency differs from base currency',
              { exchangeRate: ['Exchange rate must be > 0'] },
              422
            );
          }
        }
      }
    }

    // Update recurring invoice fields
    const updatedRecurringInvoice = await updateRecurringInvoice(userId, recurringInvoiceId, {
      clientId,
      frequency,
      startDate,
      endDate,
      dueDateDays,
      autoBill,
      notes,
      terms,
      currency: finalCurrency,
      exchangeRate: finalExchangeRate,
    });

    if (!updatedRecurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    // Update line items if provided
    if (items !== undefined) {
      await updateRecurringInvoiceItems(userId, recurringInvoiceId, items);
      // Get updated recurring invoice with new items
      const fullRecurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);
      
      // Transform response
      const transformed = toCamelCase(fullRecurringInvoice);
      transformed.client = {
        id: fullRecurringInvoice.client_id,
        name: fullRecurringInvoice.client_name,
        email: fullRecurringInvoice.client_email,
      };
      transformed.items = toCamelCaseArray(fullRecurringInvoice.items || []);

      return successResponse(
        res,
        {
          recurringInvoice: transformed,
        },
        'Recurring invoice updated successfully',
        200
      );
    }

    // Transform response
    const transformed = toCamelCase(updatedRecurringInvoice);
    transformed.client = {
      id: updatedRecurringInvoice.client_id,
      name: updatedRecurringInvoice.client_name,
      email: updatedRecurringInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(updatedRecurringInvoice.items || []);

    return successResponse(
      res,
      {
        recurringInvoice: transformed,
      },
      'Recurring invoice updated successfully',
      200
    );
  } catch (error) {
    console.error('Update recurring invoice error:', error);
    throw error;
  }
};

/**
 * Delete recurring invoice
 * DELETE /api/v1/recurring-invoices/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    // Check if recurring invoice exists
    const existingRecurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);
    if (!existingRecurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    await deleteRecurringInvoice(userId, recurringInvoiceId);

    return successResponse(
      res,
      null,
      'Recurring invoice deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete recurring invoice error:', error);
    throw error;
  }
};

/**
 * Start recurring invoice
 * POST /api/v1/recurring-invoices/:id/start
 */
export const start = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    const recurringInvoice = await startRecurringInvoice(userId, recurringInvoiceId);

    if (!recurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    // Transform response
    const transformed = toCamelCase(recurringInvoice);
    transformed.client = {
      id: recurringInvoice.client_id,
      name: recurringInvoice.client_name,
      email: recurringInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(recurringInvoice.items || []);

    return successResponse(
      res,
      {
        recurringInvoice: transformed,
      },
      'Recurring invoice started successfully',
      200
    );
  } catch (error) {
    console.error('Start recurring invoice error:', error);
    throw error;
  }
};

/**
 * Stop recurring invoice
 * POST /api/v1/recurring-invoices/:id/stop
 */
export const stop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    const recurringInvoice = await stopRecurringInvoice(userId, recurringInvoiceId);

    if (!recurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    // Transform response
    const transformed = toCamelCase(recurringInvoice);
    transformed.client = {
      id: recurringInvoice.client_id,
      name: recurringInvoice.client_name,
      email: recurringInvoice.client_email,
    };
    transformed.items = toCamelCaseArray(recurringInvoice.items || []);

    return successResponse(
      res,
      {
        recurringInvoice: transformed,
      },
      'Recurring invoice stopped successfully',
      200
    );
  } catch (error) {
    console.error('Stop recurring invoice error:', error);
    throw error;
  }
};

/**
 * Get schedule for recurring invoice
 * GET /api/v1/recurring-invoices/:id/schedule
 */
export const getSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);
    const count = parseInt(req.query.count) || 12;

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    const recurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);

    if (!recurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    const schedule = generateSchedule(recurringInvoice, count);

    return successResponse(
      res,
      {
        schedule,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get schedule error:', error);
    throw error;
  }
};

/**
 * Get invoices generated from recurring invoice
 * GET /api/v1/recurring-invoices/:id/generated-invoices
 */
export const getGeneratedInvoicesList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recurringInvoiceId = parseInt(req.params.id);

    if (isNaN(recurringInvoiceId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid recurring invoice ID',
        null,
        400
      );
    }

    // Verify recurring invoice exists
    const recurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);
    if (!recurringInvoice) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Recurring invoice not found',
        null,
        404
      );
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getGeneratedInvoices(userId, recurringInvoiceId, filters);

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
    console.error('Get generated invoices error:', error);
    throw error;
  }
};

