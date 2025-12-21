import {
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentById,
} from '../queries/payments.js';
import { getInvoiceById } from '../queries/invoices.js';
import { successResponse, errorResponse, toCamelCase } from '../utils/response.js';
import { validateCurrencyCode } from '../utils/currency.js';

/**
 * Record payment for invoice
 * POST /api/v1/invoices/:id/payments
 */
export const recordPayment = async (req, res) => {
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

    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment amount must be > 0',
        { amount: ['Payment amount must be > 0'] },
        422
      );
    }

    if (!paymentDate) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment date is required',
        { paymentDate: ['Payment date is required'] },
        422
      );
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validMethods = ['cash', 'bank_transfer', 'credit_card', 'check', 'other'];
      if (!validMethods.includes(paymentMethod)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Invalid payment method',
          { paymentMethod: [`Payment method must be one of: ${validMethods.join(', ')}`] },
          422
        );
      }
    }

    // Check invoice exists and get balance
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

    // Validate payment doesn't exceed balance
    const balanceDue = parseFloat(invoice.balance_due || 0);
    if (amount > balanceDue) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment amount cannot exceed invoice balance',
        { amount: [`Payment amount cannot exceed balance due (${balanceDue})`] },
        422
      );
    }

    // Validate currency if provided (must match invoice currency)
    const invoiceCurrency = invoice.currency || 'MVR';
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
      if (currency !== invoiceCurrency) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Payment currency must match invoice currency',
          { currency: [`Payment currency must be ${invoiceCurrency} to match invoice`] },
          422
        );
      }
    }

    // Create payment (currency will be auto-set from invoice if not provided)
    const result = await createPayment(userId, invoiceId, {
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod: paymentMethod || null,
      currency: currency || invoiceCurrency,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
    });

    // Transform response
    const transformedPayment = toCamelCase(result.payment);
    const transformedInvoice = toCamelCase(result.invoice);
    transformedInvoice.client = {
      id: result.invoice.client_id,
      name: result.invoice.client_name,
      email: result.invoice.client_email,
    };

    return successResponse(
      res,
      {
        payment: transformedPayment,
        invoice: transformedInvoice,
      },
      'Payment recorded successfully',
      201
    );
  } catch (error) {
    console.error('Record payment error:', error);
    if (error.message === 'INVOICE_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }
    if (error.message === 'PAYMENT_EXCEEDS_BALANCE') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment amount cannot exceed invoice balance',
        { amount: ['Payment amount cannot exceed balance due'] },
        422
      );
    }
    throw error;
  }
};

/**
 * Update payment
 * PUT /api/v1/invoices/:id/payments/:paymentId
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(invoiceId) || isNaN(paymentId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid invoice ID or payment ID',
        null,
        400
      );
    }

    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    } = req.body;

    // Validate payment method if provided
    if (paymentMethod !== undefined) {
      const validMethods = ['cash', 'bank_transfer', 'credit_card', 'check', 'other'];
      if (paymentMethod && !validMethods.includes(paymentMethod)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Invalid payment method',
          { paymentMethod: [`Payment method must be one of: ${validMethods.join(', ')}`] },
          422
        );
      }
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment amount must be > 0',
        { amount: ['Payment amount must be > 0'] },
        422
      );
    }

    // Update payment
    const result = await updatePayment(userId, invoiceId, paymentId, {
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    });

    // Transform response
    const transformedPayment = toCamelCase(result.payment);
    const transformedInvoice = toCamelCase(result.invoice);
    transformedInvoice.client = {
      id: result.invoice.client_id,
      name: result.invoice.client_name,
      email: result.invoice.client_email,
    };

    return successResponse(
      res,
      {
        payment: transformedPayment,
        invoice: transformedInvoice,
      },
      'Payment updated successfully',
      200
    );
  } catch (error) {
    console.error('Update payment error:', error);
    if (error.message === 'PAYMENT_NOT_FOUND' || error.message === 'INVOICE_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Payment or invoice not found',
        null,
        404
      );
    }
    if (error.message === 'PAYMENT_EXCEEDS_BALANCE') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Payment amount cannot exceed invoice balance',
        { amount: ['Payment amount cannot exceed balance due'] },
        422
      );
    }
    throw error;
  }
};

/**
 * Delete payment
 * DELETE /api/v1/invoices/:id/payments/:paymentId
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(invoiceId) || isNaN(paymentId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid invoice ID or payment ID',
        null,
        400
      );
    }

    // Verify payment exists
    const payment = await getPaymentById(userId, paymentId);
    if (!payment || payment.invoice_id !== invoiceId) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Payment not found',
        null,
        404
      );
    }

    // Delete payment and get updated invoice
    const updatedInvoice = await deletePayment(userId, invoiceId, paymentId);

    // Transform response
    const transformed = toCamelCase(updatedInvoice);
    transformed.client = {
      id: updatedInvoice.client_id,
      name: updatedInvoice.client_name,
      email: updatedInvoice.client_email,
    };

    return successResponse(
      res,
      {
        invoice: transformed,
      },
      'Payment deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete payment error:', error);
    if (error.message === 'PAYMENT_NOT_FOUND' || error.message === 'INVOICE_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Payment or invoice not found',
        null,
        404
      );
    }
    throw error;
  }
};


