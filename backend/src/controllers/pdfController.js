import { generateQuotationPDF, generateInvoicePDF } from '../utils/pdfGenerator.js';
import { errorResponse } from '../utils/response.js';

/**
 * Generate quotation PDF
 * GET /api/v1/quotations/:id/pdf
 */
export const generateQuotationPDFController = async (req, res) => {
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

    const doc = await generateQuotationPDF(userId, quotationId);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotationId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Generate quotation PDF error:', error);
    if (error.message === 'QUOTATION_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Quotation not found',
        null,
        404
      );
    }
    throw error;
  }
};

/**
 * Generate invoice PDF
 * GET /api/v1/invoices/:id/pdf
 */
export const generateInvoicePDFController = async (req, res) => {
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

    const doc = await generateInvoicePDF(userId, invoiceId);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    if (error.message === 'INVOICE_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Invoice not found',
        null,
        404
      );
    }
    throw error;
  }
};



