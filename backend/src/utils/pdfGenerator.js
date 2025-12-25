import PDFDocument from 'pdfkit';
import { getOrCreateSettings } from '../queries/settings.js';
import { getQuotationById } from '../queries/quotations.js';
import { getInvoiceById } from '../queries/invoices.js';
import { getDocumentByShareLink } from '../queries/shareLinks.js';
import { query } from '../config/database.js';
import { toCamelCase, toCamelCaseArray } from './response.js';

/**
 * Generate quotation PDF
 */
export const generateQuotationPDF = async (userId, quotationId) => {
  // Get quotation
  const quotation = await getQuotationById(userId, quotationId);
  if (!quotation) {
    throw new Error('QUOTATION_NOT_FOUND');
  }

  // Get company settings
  const settings = await getOrCreateSettings(userId);
  const company = toCamelCase(settings);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Helper function to add header
  const addHeader = () => {
    // Company logo (if available)
    if (company.logoUrl) {
      // In production, load actual image
      // For now, just add text
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    } else {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    }

    // Company details
    let yPos = 80;
    if (company.registeredAddress) {
      doc.fontSize(10).text(company.registeredAddress, 50, yPos);
      yPos += 15;
    }
    if (company.email) {
      doc.fontSize(10).text(`Email: ${company.email}`, 50, yPos);
      yPos += 15;
    }
    if (company.phone) {
      doc.fontSize(10).text(`Phone: ${company.phone}`, 50, yPos);
    }

    // Document title
    doc.fontSize(24).text('QUOTATION', 400, 50, { align: 'right' });
    doc.fontSize(12).text(`#${quotation.number}`, 400, 80, { align: 'right' });
  };

  // Helper function to add client info
  const addClientInfo = (yStart) => {
    let yPos = yStart;
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 20;
    doc.font('Helvetica').fontSize(10);
    
    const client = toCamelCase(quotation);
    if (quotation.client_name) {
      doc.text(quotation.client_name, 50, yPos);
      yPos += 15;
    }
    if (quotation.client_email) {
      doc.text(quotation.client_email, 50, yPos);
      yPos += 15;
    }
  };

  // Helper function to add document details
  const addDocumentDetails = (yStart) => {
    let yPos = yStart;
    doc.fontSize(10);
    doc.text(`Issue Date: ${quotation.issue_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Expiry Date: ${quotation.expiry_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Status: ${quotation.status.toUpperCase()}`, 400, yPos, { align: 'right' });
  };

  // Helper function to add line items table
  const addLineItems = (yStart) => {
    let yPos = yStart + 20;
    
    // Table header
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 50, yPos);
    doc.text('Qty', 250, yPos);
    doc.text('Price', 300, yPos);
    doc.text('Discount', 360, yPos);
    doc.text('Tax', 420, yPos);
    doc.text('Total', 480, yPos, { align: 'right' });
    
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    // Line items
    doc.font('Helvetica').fontSize(9);
    const items = quotation.items || [];
    items.forEach((item) => {
      const itemData = toCamelCase(item);
      const name = itemData.name || '';
      const description = itemData.description || '';
      const quantity = parseFloat(itemData.quantity || 0).toFixed(2);
      const price = parseFloat(itemData.price || 0).toFixed(2);
      const discountPercent = parseFloat(itemData.discountPercent || 0).toFixed(1);
      const taxPercent = parseFloat(itemData.taxPercent || 0).toFixed(1);
      const lineTotal = parseFloat(itemData.lineTotal || 0).toFixed(2);

      // Item name (truncate if too long)
      const displayName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      doc.text(displayName, 50, yPos);
      
      // If description exists, add it below
      if (description) {
        yPos += 12;
        doc.fontSize(8).text(description.substring(0, 40), 50, yPos);
        yPos -= 12;
      }

      doc.text(quantity, 250, yPos);
      doc.text(price, 300, yPos);
      doc.text(`${discountPercent}%`, 360, yPos);
      doc.text(`${taxPercent}%`, 420, yPos);
      doc.text(lineTotal, 480, yPos, { align: 'right' });
      
      yPos += 20;
      if (description) yPos += 12;
    });

    return yPos;
  };

  // Helper function to add totals
  const addTotals = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(quotation.subtotal || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    if (parseFloat(quotation.discount_total || 0) > 0) {
      doc.text('Discount:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(quotation.discount_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    if (parseFloat(quotation.tax_total || 0) > 0) {
      doc.text('Tax:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(quotation.tax_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
    yPos += 10;
    doc.text('Total:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(quotation.total_amount || 0).toFixed(2), 480, yPos, { align: 'right' });

    return yPos + 30;
  };

  // Build PDF
  addHeader();
  addClientInfo(150);
  addDocumentDetails(150);
  const itemsEnd = addLineItems(220);
  addTotals(itemsEnd);

  // Add notes and terms
  let notesY = itemsEnd + 100;
  if (quotation.notes) {
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(quotation.notes, 50, notesY, { width: 500 });
    notesY += 30;
  }

  if (quotation.terms) {
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(quotation.terms, 50, notesY, { width: 500 });
  }

  return doc;
};

/**
 * Generate invoice PDF
 */
export const generateInvoicePDF = async (userId, invoiceId) => {
  // Get invoice
  const invoice = await getInvoiceById(userId, invoiceId);
  if (!invoice) {
    throw new Error('INVOICE_NOT_FOUND');
  }

  // Get company settings
  const settings = await getOrCreateSettings(userId);
  const company = toCamelCase(settings);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Helper function to add header
  const addHeader = () => {
    // Company logo (if available)
    if (company.logoUrl) {
      // In production, load actual image
      // For now, just add text
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    } else {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    }

    // Company details
    let yPos = 80;
    if (company.registeredAddress) {
      doc.fontSize(10).text(company.registeredAddress, 50, yPos);
      yPos += 15;
    }
    if (company.email) {
      doc.fontSize(10).text(`Email: ${company.email}`, 50, yPos);
      yPos += 15;
    }
    if (company.phone) {
      doc.fontSize(10).text(`Phone: ${company.phone}`, 50, yPos);
    }

    // Document title
    doc.fontSize(24).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(12).text(`#${invoice.number}`, 400, 80, { align: 'right' });
  };

  // Helper function to add client info
  const addClientInfo = (yStart) => {
    let yPos = yStart;
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 20;
    doc.font('Helvetica').fontSize(10);
    
    if (invoice.client_name) {
      doc.text(invoice.client_name, 50, yPos);
      yPos += 15;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, 50, yPos);
      yPos += 15;
    }
  };

  // Helper function to add document details
  const addDocumentDetails = (yStart) => {
    let yPos = yStart;
    doc.fontSize(10);
    doc.text(`Issue Date: ${invoice.issue_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Due Date: ${invoice.due_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, yPos, { align: 'right' });
  };

  // Helper function to add line items table
  const addLineItems = (yStart) => {
    let yPos = yStart + 20;
    
    // Table header
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 50, yPos);
    doc.text('Qty', 250, yPos);
    doc.text('Price', 300, yPos);
    doc.text('Discount', 360, yPos);
    doc.text('Tax', 420, yPos);
    doc.text('Total', 480, yPos, { align: 'right' });
    
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    // Line items
    doc.font('Helvetica').fontSize(9);
    const items = invoice.items || [];
    items.forEach((item) => {
      const itemData = toCamelCase(item);
      const name = itemData.name || '';
      const description = itemData.description || '';
      const quantity = parseFloat(itemData.quantity || 0).toFixed(2);
      const price = parseFloat(itemData.price || 0).toFixed(2);
      const discountPercent = parseFloat(itemData.discountPercent || 0).toFixed(1);
      const taxPercent = parseFloat(itemData.taxPercent || 0).toFixed(1);
      const lineTotal = parseFloat(itemData.lineTotal || 0).toFixed(2);

      // Item name (truncate if too long)
      const displayName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      doc.text(displayName, 50, yPos);
      
      // If description exists, add it below
      if (description) {
        yPos += 12;
        doc.fontSize(8).text(description.substring(0, 40), 50, yPos);
        yPos -= 12;
      }

      doc.text(quantity, 250, yPos);
      doc.text(price, 300, yPos);
      doc.text(`${discountPercent}%`, 360, yPos);
      doc.text(`${taxPercent}%`, 420, yPos);
      doc.text(lineTotal, 480, yPos, { align: 'right' });
      
      yPos += 20;
      if (description) yPos += 12;
    });

    return yPos;
  };

  // Helper function to add totals
  const addTotals = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.subtotal || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    if (parseFloat(invoice.discount_total || 0) > 0) {
      doc.text('Discount:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.discount_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    if (parseFloat(invoice.tax_total || 0) > 0) {
      doc.text('Tax:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.tax_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
    yPos += 10;
    doc.text('Total:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.total_amount || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    // Payment information
    if (parseFloat(invoice.amount_paid || 0) > 0) {
      doc.font('Helvetica').fontSize(10);
      doc.text('Amount Paid:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.amount_paid || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Balance Due:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.balance_due || 0).toFixed(2), 480, yPos, { align: 'right' });

    return yPos + 30;
  };

  // Build PDF
  addHeader();
  addClientInfo(150);
  addDocumentDetails(150);
  const itemsEnd = addLineItems(220);
  addTotals(itemsEnd);

  // Add notes and terms
  let notesY = itemsEnd + 100;
  if (invoice.notes) {
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(invoice.notes, 50, notesY, { width: 500 });
    notesY += 30;
  }

  if (invoice.terms) {
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(invoice.terms, 50, notesY, { width: 500 });
  }

  return doc;
};

/**
 * Generate quotation PDF from share link token
 */
export const generateQuotationPDFFromToken = async (token) => {
  // Get document via share link
  const documentData = await getDocumentByShareLink(token);
  
  if (!documentData || documentData.type !== 'quotation') {
    throw new Error('QUOTATION_NOT_FOUND');
  }

  const quotation = documentData.document;

  // Get user_id from quotation to fetch company settings
  const userId = quotation.user_id;
  const settings = await getOrCreateSettings(userId);
  const company = toCamelCase(settings);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Helper function to add header
  const addHeader = () => {
    if (company.logoUrl) {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    } else {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    }

    let yPos = 80;
    if (company.registeredAddress) {
      doc.fontSize(10).text(company.registeredAddress, 50, yPos);
      yPos += 15;
    }
    if (company.email) {
      doc.fontSize(10).text(`Email: ${company.email}`, 50, yPos);
      yPos += 15;
    }
    if (company.phone) {
      doc.fontSize(10).text(`Phone: ${company.phone}`, 50, yPos);
    }

    doc.fontSize(24).text('QUOTATION', 400, 50, { align: 'right' });
    doc.fontSize(12).text(`#${quotation.number}`, 400, 80, { align: 'right' });
  };

  const addClientInfo = (yStart) => {
    let yPos = yStart;
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 20;
    doc.font('Helvetica').fontSize(10);
    
    if (quotation.client_name) {
      doc.text(quotation.client_name, 50, yPos);
      yPos += 15;
    }
    if (quotation.client_email) {
      doc.text(quotation.client_email, 50, yPos);
      yPos += 15;
    }
  };

  const addDocumentDetails = (yStart) => {
    let yPos = yStart;
    doc.fontSize(10);
    doc.text(`Issue Date: ${quotation.issue_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Expiry Date: ${quotation.expiry_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Status: ${quotation.status.toUpperCase()}`, 400, yPos, { align: 'right' });
  };

  const addLineItems = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 50, yPos);
    doc.text('Qty', 250, yPos);
    doc.text('Price', 300, yPos);
    doc.text('Discount', 360, yPos);
    doc.text('Tax', 420, yPos);
    doc.text('Total', 480, yPos, { align: 'right' });
    
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    doc.font('Helvetica').fontSize(9);
    const items = quotation.items || [];
    items.forEach((item) => {
      const itemData = toCamelCase(item);
      const name = itemData.name || '';
      const description = itemData.description || '';
      const quantity = parseFloat(itemData.quantity || 0).toFixed(2);
      const price = parseFloat(itemData.price || 0).toFixed(2);
      const discountPercent = parseFloat(itemData.discountPercent || 0).toFixed(1);
      const taxPercent = parseFloat(itemData.taxPercent || 0).toFixed(1);
      const lineTotal = parseFloat(itemData.lineTotal || 0).toFixed(2);

      const displayName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      doc.text(displayName, 50, yPos);
      
      if (description) {
        yPos += 12;
        doc.fontSize(8).text(description.substring(0, 40), 50, yPos);
        yPos -= 12;
      }

      doc.text(quantity, 250, yPos);
      doc.text(price, 300, yPos);
      doc.text(`${discountPercent}%`, 360, yPos);
      doc.text(`${taxPercent}%`, 420, yPos);
      doc.text(lineTotal, 480, yPos, { align: 'right' });
      
      yPos += 20;
      if (description) yPos += 12;
    });

    return yPos;
  };

  const addTotals = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(quotation.subtotal || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    if (parseFloat(quotation.discount_total || 0) > 0) {
      doc.text('Discount:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(quotation.discount_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    if (parseFloat(quotation.tax_total || 0) > 0) {
      doc.text('Tax:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(quotation.tax_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
    yPos += 10;
    doc.text('Total:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(quotation.total_amount || 0).toFixed(2), 480, yPos, { align: 'right' });

    return yPos + 30;
  };

  addHeader();
  addClientInfo(150);
  addDocumentDetails(150);
  const itemsEnd = addLineItems(220);
  addTotals(itemsEnd);

  let notesY = itemsEnd + 100;
  if (quotation.notes) {
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(quotation.notes, 50, notesY, { width: 500 });
    notesY += 30;
  }

  if (quotation.terms) {
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(quotation.terms, 50, notesY, { width: 500 });
  }

  return doc;
};

/**
 * Generate invoice PDF from share link token
 */
export const generateInvoicePDFFromToken = async (token) => {
  // Get document via share link
  const documentData = await getDocumentByShareLink(token);
  
  if (!documentData || documentData.type !== 'invoice') {
    throw new Error('INVOICE_NOT_FOUND');
  }

  const invoice = documentData.document;

  // Get user_id from invoice to fetch company settings
  const userId = invoice.user_id;
  const settings = await getOrCreateSettings(userId);
  const company = toCamelCase(settings);

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const addHeader = () => {
    if (company.logoUrl) {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    } else {
      doc.fontSize(20).text(company.companyName || 'Company', 50, 50);
    }

    let yPos = 80;
    if (company.registeredAddress) {
      doc.fontSize(10).text(company.registeredAddress, 50, yPos);
      yPos += 15;
    }
    if (company.email) {
      doc.fontSize(10).text(`Email: ${company.email}`, 50, yPos);
      yPos += 15;
    }
    if (company.phone) {
      doc.fontSize(10).text(`Phone: ${company.phone}`, 50, yPos);
    }

    doc.fontSize(24).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(12).text(`#${invoice.number}`, 400, 80, { align: 'right' });
  };

  const addClientInfo = (yStart) => {
    let yPos = yStart;
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 20;
    doc.font('Helvetica').fontSize(10);
    
    if (invoice.client_name) {
      doc.text(invoice.client_name, 50, yPos);
      yPos += 15;
    }
    if (invoice.client_email) {
      doc.text(invoice.client_email, 50, yPos);
      yPos += 15;
    }
  };

  const addDocumentDetails = (yStart) => {
    let yPos = yStart;
    doc.fontSize(10);
    doc.text(`Issue Date: ${invoice.issue_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Due Date: ${invoice.due_date}`, 400, yPos, { align: 'right' });
    yPos += 15;
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, yPos, { align: 'right' });
  };

  const addLineItems = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 50, yPos);
    doc.text('Qty', 250, yPos);
    doc.text('Price', 300, yPos);
    doc.text('Discount', 360, yPos);
    doc.text('Tax', 420, yPos);
    doc.text('Total', 480, yPos, { align: 'right' });
    
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 10;

    doc.font('Helvetica').fontSize(9);
    const items = invoice.items || [];
    items.forEach((item) => {
      const itemData = toCamelCase(item);
      const name = itemData.name || '';
      const description = itemData.description || '';
      const quantity = parseFloat(itemData.quantity || 0).toFixed(2);
      const price = parseFloat(itemData.price || 0).toFixed(2);
      const discountPercent = parseFloat(itemData.discountPercent || 0).toFixed(1);
      const taxPercent = parseFloat(itemData.taxPercent || 0).toFixed(1);
      const lineTotal = parseFloat(itemData.lineTotal || 0).toFixed(2);

      const displayName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      doc.text(displayName, 50, yPos);
      
      if (description) {
        yPos += 12;
        doc.fontSize(8).text(description.substring(0, 40), 50, yPos);
        yPos -= 12;
      }

      doc.text(quantity, 250, yPos);
      doc.text(price, 300, yPos);
      doc.text(`${discountPercent}%`, 360, yPos);
      doc.text(`${taxPercent}%`, 420, yPos);
      doc.text(lineTotal, 480, yPos, { align: 'right' });
      
      yPos += 20;
      if (description) yPos += 12;
    });

    return yPos;
  };

  const addTotals = (yStart) => {
    let yPos = yStart + 20;
    
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.subtotal || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    if (parseFloat(invoice.discount_total || 0) > 0) {
      doc.text('Discount:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.discount_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    if (parseFloat(invoice.tax_total || 0) > 0) {
      doc.text('Tax:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.tax_total || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
    yPos += 10;
    doc.text('Total:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.total_amount || 0).toFixed(2), 480, yPos, { align: 'right' });
    yPos += 20;

    if (parseFloat(invoice.amount_paid || 0) > 0) {
      doc.font('Helvetica').fontSize(10);
      doc.text('Amount Paid:', 400, yPos, { align: 'right' });
      doc.text(parseFloat(invoice.amount_paid || 0).toFixed(2), 480, yPos, { align: 'right' });
      yPos += 20;
    }

    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Balance Due:', 400, yPos, { align: 'right' });
    doc.text(parseFloat(invoice.balance_due || 0).toFixed(2), 480, yPos, { align: 'right' });

    return yPos + 30;
  };

  addHeader();
  addClientInfo(150);
  addDocumentDetails(150);
  const itemsEnd = addLineItems(220);
  addTotals(itemsEnd);

  let notesY = itemsEnd + 100;
  if (invoice.notes) {
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(invoice.notes, 50, notesY, { width: 500 });
    notesY += 30;
  }

  if (invoice.terms) {
    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).text(invoice.terms, 50, notesY, { width: 500 });
  }

  return doc;
};



