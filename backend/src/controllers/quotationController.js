import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationItems,
  deleteQuotation,
  verifyClientOwnership,
} from '../queries/quotations.js';
import { createInvoice } from '../queries/invoices.js';
import { getQuotationPrefix, getInvoicePrefix, getSettings } from '../queries/settings.js';
import { generateQuotationNumber, generateInvoiceNumber } from '../utils/numbering.js';
import { query } from '../config/database.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';
import { validateCurrencyCode } from '../utils/currency.js';
import { sendEmail, generateQuotationEmailTemplate } from '../utils/emailService.js';
import { createShareLink } from '../queries/shareLinks.js';

/**
 * Get list of quotations
 * GET /api/v1/quotations
 */
export const listQuotations = async (req, res) => {
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

    const result = await getQuotations(userId, filters);

    // Transform quotations
    const transformedQuotations = result.quotations.map(q => {
      const transformed = toCamelCase(q);
      transformed.clientName = q.client_name;
      return transformed;
    });

    return successResponse(
      res,
      {
        quotations: transformedQuotations,
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List quotations error:', error);
    throw error;
  }
};

/**
 * Get quotation by ID
 * GET /api/v1/quotations/:id
 */
export const getQuotation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotationId = parseInt(req.params.id);

    if (isNaN(quotationId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid quotation ID',
        null,
        400
      );
    }

    const quotation = await getQuotationById(userId, quotationId);

    if (!quotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    // Transform quotation
    const transformed = toCamelCase(quotation);
    transformed.client = {
      id: quotation.client_id,
      name: quotation.client_name,
      email: quotation.client_email,
    };
    transformed.items = toCamelCaseArray(quotation.items || []);

    return successResponse(
      res,
      {
        quotation: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get quotation error:', error);
    throw error;
  }
};

/**
 * Create new quotation
 * POST /api/v1/quotations
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      clientId,
      issueDate,
      expiryDate,
      notes,
      terms,
      status = 'draft',
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

    if (!issueDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Issue date is required',
        { issueDate: ['Issue date is required'] },
        422
      );
    }

    if (!expiryDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Expiry date is required',
        { expiryDate: ['Expiry date is required'] },
        422
      );
    }

    if (new Date(expiryDate) < new Date(issueDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Expiry date must be >= issue date',
        { expiryDate: ['Expiry date must be >= issue date'] },
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
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
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
      // If currency is base currency, exchange rate should be null
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

    // Get quotation prefix and generate number
    const prefix = await getQuotationPrefix(userId);
    const quotationNumber = await generateQuotationNumber(userId, prefix, query);

    // Create quotation with line items
    const quotation = await createQuotation(
      userId,
      {
        clientId,
        issueDate,
        expiryDate,
        notes,
        terms,
        status,
        currency: documentCurrency,
        exchangeRate: documentCurrency !== baseCurrency ? exchangeRate : null,
      },
      items,
      quotationNumber
    );

    // Transform response
    const transformed = toCamelCase(quotation);
    transformed.client = {
      id: quotation.client_id,
      name: quotation.client_name,
      email: quotation.client_email,
    };
    transformed.items = toCamelCaseArray(quotation.items || []);

    return successResponse(
      res,
      {
        quotation: transformed,
      },
      'Quotation created successfully',
      201
    );
  } catch (error) {
    console.error('Create quotation error:', error);
    throw error;
  }
};

/**
 * Update quotation
 * PUT /api/v1/quotations/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotationId = parseInt(req.params.id);

    if (isNaN(quotationId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid quotation ID',
        null,
        400
      );
    }

    // Check if quotation exists
    const existingQuotation = await getQuotationById(userId, quotationId);
    if (!existingQuotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    const {
      clientId,
      issueDate,
      expiryDate,
      notes,
      terms,
      status,
      items,
      currency,
      exchangeRate,
    } = req.body;

    // Validation
    if (issueDate && expiryDate && new Date(expiryDate) < new Date(issueDate)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Expiry date must be >= issue date',
        { expiryDate: ['Expiry date must be >= issue date'] },
        422
      );
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
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
        // If currency is base currency, exchange rate should be null
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
    } else if (exchangeRate !== undefined) {
      // If exchange rate is provided but currency is not, use existing currency
      const settings = await getSettings(userId);
      const baseCurrency = settings?.base_currency || 'USD';
      const existingCurrency = existingQuotation.currency || settings?.currency || 'MVR';

      if (existingCurrency !== baseCurrency) {
        if (exchangeRate === null || exchangeRate <= 0) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            'Exchange rate must be > 0 when currency differs from base currency',
            { exchangeRate: ['Exchange rate must be > 0'] },
            422
          );
        }
      } else {
        if (exchangeRate !== null) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            'Exchange rate should be null when currency is base currency',
            { exchangeRate: ['Exchange rate should be null'] },
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
    let finalCurrency = currency !== undefined ? currency : existingQuotation.currency;
    let finalExchangeRate = exchangeRate !== undefined ? exchangeRate : existingQuotation.exchange_rate;

    // If currency changed, recalculate exchange rate requirement
    if (currency !== undefined) {
      if (currency === baseCurrency) {
        finalExchangeRate = null;
      } else if (exchangeRate === undefined) {
        // If currency changed but exchange rate not provided, keep existing or require it
        if (existingQuotation.currency === baseCurrency) {
          // Currency changed from base to non-base, require exchange rate
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

    // Update quotation fields
    const updatedQuotation = await updateQuotation(userId, quotationId, {
      clientId,
      issueDate,
      expiryDate,
      notes,
      terms,
      status,
      currency: finalCurrency,
      exchangeRate: finalExchangeRate,
    });

    if (!updatedQuotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    // Update line items if provided
    if (items !== undefined) {
      await updateQuotationItems(userId, quotationId, items);
      // Get updated quotation with new items
      const fullQuotation = await getQuotationById(userId, quotationId);
      
      // Transform response
      const transformed = toCamelCase(fullQuotation);
      transformed.client = {
        id: fullQuotation.client_id,
        name: fullQuotation.client_name,
        email: fullQuotation.client_email,
      };
      transformed.items = toCamelCaseArray(fullQuotation.items || []);

      return successResponse(
        res,
        {
          quotation: transformed,
        },
        'Quotation updated successfully',
        200
      );
    }

    // Transform response
    const transformed = toCamelCase(updatedQuotation);
    transformed.client = {
      id: updatedQuotation.client_id,
      name: updatedQuotation.client_name,
      email: updatedQuotation.client_email,
    };
    transformed.items = toCamelCaseArray(updatedQuotation.items || []);

    return successResponse(
      res,
      {
        quotation: transformed,
      },
      'Quotation updated successfully',
      200
    );
  } catch (error) {
    console.error('Update quotation error:', error);
    throw error;
  }
};

/**
 * Delete quotation
 * DELETE /api/v1/quotations/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotationId = parseInt(req.params.id);

    if (isNaN(quotationId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid quotation ID',
        null,
        400
      );
    }

    // Check if quotation exists
    const existingQuotation = await getQuotationById(userId, quotationId);
    if (!existingQuotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    await deleteQuotation(userId, quotationId);

    return successResponse(
      res,
      null,
      'Quotation deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete quotation error:', error);
    throw error;
  }
};

/**
 * Convert quotation to invoice
 * POST /api/v1/quotations/:id/convert
 */
export const convertToInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotationId = parseInt(req.params.id);

    if (isNaN(quotationId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid quotation ID',
        null,
        400
      );
    }

    // Get quotation
    const quotation = await getQuotationById(userId, quotationId);
    if (!quotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    const { issueDate, dueDate } = req.body;

    // Validate dates
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

    // Validate quotation has items
    if (!quotation.items || quotation.items.length === 0) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Quotation must have at least one line item to convert',
        null,
        422
      );
    }

    // Generate invoice number
    const prefix = await getInvoicePrefix(userId);
    const invoiceNumber = await generateInvoiceNumber(userId, prefix, query);

    // Transform quotation items to invoice items
    const invoiceItems = quotation.items.map(item => ({
      itemId: item.item_id,
      name: item.name,
      description: item.description,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
      discountPercent: parseFloat(item.discount_percent || 0),
      taxPercent: parseFloat(item.tax_percent || 0),
    }));

    // Create invoice from quotation
    const invoice = await createInvoice(
      userId,
      {
        clientId: quotation.client_id,
        issueDate,
        dueDate,
        notes: quotation.notes,
        terms: quotation.terms,
        status: 'draft',
      },
      invoiceItems,
      invoiceNumber
    );

    // Update quotation status to 'accepted'
    await updateQuotation(userId, quotationId, {
      status: 'accepted',
    });

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
      'Quotation converted to invoice successfully',
      201
    );
  } catch (error) {
    console.error('Convert quotation error:', error);
    throw error;
  }
};

/**
 * Send quotation email to client
 * POST /api/v1/quotations/:id/send-email
 */
export const sendQuotationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotationId = parseInt(req.params.id);

    if (isNaN(quotationId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid quotation ID',
        null,
        400
      );
    }

    // Get quotation with client info
    const quotation = await getQuotationById(userId, quotationId);
    if (!quotation) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    // Check if client has email
    if (!quotation.client_email) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Client email address is required to send quotation',
        { email: ['Client must have an email address'] },
        422
      );
    }

    // Get company settings
    const settings = await getSettings(userId);
    if (!settings) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Company settings not found',
        null,
        404
      );
    }

    // Create or get existing share link
    let shareLink;
    const existingLink = await query(
      'SELECT * FROM share_links WHERE document_type = $1 AND document_id = $2 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      ['quotation', quotationId]
    );

    if (existingLink.rows.length > 0) {
      shareLink = existingLink.rows[0];
    } else {
      // Create new share link
      shareLink = await createShareLink(userId, {
        documentType: 'quotation',
        documentId: quotationId,
        password: null,
        expiresAt: quotation.expiry_date || null,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${frontendUrl}/share/quotation/${shareLink.token}`;
    const acceptUrl = `${frontendUrl}/api/v1/public/quotations/${shareLink.token}/accept`;
    const rejectUrl = `${frontendUrl}/api/v1/public/quotations/${shareLink.token}/reject`;

    // Generate email HTML
    const emailHtml = generateQuotationEmailTemplate({
      quotation: toCamelCase(quotation),
      company: settings,
      client: {
        name: quotation.client_name,
        email: quotation.client_email,
      },
      shareUrl,
      acceptUrl,
      rejectUrl,
    });

    // Send email
    await sendEmail({
      to: quotation.client_email,
      subject: `Quotation ${quotation.number} from ${settings.companyName || settings.name || 'Company'}`,
      html: emailHtml,
    });

    // Update quotation status to 'sent' if not already
    if (quotation.status !== 'sent') {
      await updateQuotation(userId, quotationId, {
        status: 'sent',
      });
    }

    return successResponse(
      res,
      {
        message: 'Quotation email sent successfully',
        shareLink: {
          token: shareLink.token,
          url: shareUrl,
        },
      },
      'Quotation email sent successfully',
      200
    );
  } catch (error) {
    console.error('Send quotation email error:', error);
    throw error;
  }
};

/**
 * Accept quotation (public endpoint - no auth required)
 * POST /api/v1/public/quotations/:token/accept
 */
export const acceptQuotation = async (req, res) => {
  try {
    const { token } = req.params;

    // Get share link
    const shareLinkResult = await query(
      'SELECT * FROM share_links WHERE token = $1 AND document_type = $2 AND is_active = true',
      [token, 'quotation']
    );

    if (shareLinkResult.rows.length === 0) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found or inactive',
        null,
        404
      );
    }

    const shareLink = shareLinkResult.rows[0];

    // Check if expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return errorResponse(
        res,
        'GONE',
        'Share link has expired',
        null,
        410
      );
    }

    // Get quotation
    const quotation = await query(
      'SELECT * FROM quotations WHERE id = $1',
      [shareLink.document_id]
    );

    if (quotation.rows.length === 0) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    const quotationData = quotation.rows[0];

    // Update quotation status to 'accepted'
    await query(
      'UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', shareLink.document_id]
    );

    // Get user ID for response
    const userId = quotationData.user_id;

    // Get updated quotation
    const updatedQuotation = await getQuotationById(userId, shareLink.document_id);

    return successResponse(
      res,
      {
        quotation: toCamelCase(updatedQuotation),
        message: 'Quotation accepted successfully',
      },
      'Quotation accepted successfully',
      200
    );
  } catch (error) {
    console.error('Accept quotation error:', error);
    throw error;
  }
};

/**
 * Reject quotation (public endpoint - no auth required)
 * POST /api/v1/public/quotations/:token/reject
 */
export const rejectQuotation = async (req, res) => {
  try {
    const { token } = req.params;

    // Get share link
    const shareLinkResult = await query(
      'SELECT * FROM share_links WHERE token = $1 AND document_type = $2 AND is_active = true',
      [token, 'quotation']
    );

    if (shareLinkResult.rows.length === 0) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found or inactive',
        null,
        404
      );
    }

    const shareLink = shareLinkResult.rows[0];

    // Check if expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return errorResponse(
        res,
        'GONE',
        'Share link has expired',
        null,
        410
      );
    }

    // Get quotation
    const quotation = await query(
      'SELECT * FROM quotations WHERE id = $1',
      [shareLink.document_id]
    );

    if (quotation.rows.length === 0) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }

    const quotationData = quotation.rows[0];

    // Update quotation status to 'rejected'
    await query(
      'UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', shareLink.document_id]
    );

    // Get user ID for response
    const userId = quotationData.user_id;

    // Get updated quotation
    const updatedQuotation = await getQuotationById(userId, shareLink.document_id);

    return successResponse(
      res,
      {
        quotation: toCamelCase(updatedQuotation),
        message: 'Quotation rejected',
      },
      'Quotation rejected',
      200
    );
  } catch (error) {
    console.error('Reject quotation error:', error);
    throw error;
  }
};

