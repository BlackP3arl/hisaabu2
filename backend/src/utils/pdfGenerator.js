import PDFDocument from 'pdfkit';
import { getOrCreateSettings } from '../queries/settings.js';
import { getQuotationById } from '../queries/quotations.js';
import { getInvoiceById } from '../queries/invoices.js';
import { getDocumentByShareLink } from '../queries/shareLinks.js';
import { query } from '../config/database.js';
import { toCamelCase, toCamelCaseArray } from './response.js';
import { formatCurrency, getCurrencySymbol } from './currency.js';
import { getDefaultTax } from '../queries/taxes.js';

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

  // Get currency info
  const documentCurrency = quotation.currency || company.currency || 'MVR';
  const baseCurrency = company.baseCurrency || 'USD';
  const currencySymbol = getCurrencySymbol(documentCurrency);
  const showExchangeRate = quotation.exchange_rate && documentCurrency !== baseCurrency;

  // Create PDF with better margins
  const doc = new PDFDocument({ 
    margin: 40, 
    size: 'A4',
    info: {
      Title: `Quotation ${quotation.number}`,
      Author: company.companyName || 'Company',
      Subject: 'Quotation',
    }
  });

  // Helper to format currency
  const formatCurrencyValue = (amount) => {
    const formatted = parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatted} ${currencySymbol}`;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    const colors = {
      draft: '#6B7280',
      sent: '#3B82F6',
      accepted: '#10B981',
      rejected: '#EF4444',
      expired: '#EF4444',
    };
    return colors[status?.toLowerCase()] || '#6B7280';
  };

  // Add branded header section
  const addHeader = () => {
    // Header background (light gray)
    doc.rect(0, 0, 595, 120)
      .fillColor('#F8F9FA')
      .fill()
      .fillColor('#000000');

    let yPos = 50;

    // Company branding area (left side)
    // Company icon placeholder (colored box)
    doc.rect(50, yPos, 40, 40)
      .fillColor('#3B82F6')
      .fill()
      .fillColor('#FFFFFF')
      .fontSize(24)
      .text('B', 65, yPos + 8, { align: 'center', width: 40 })
      .fillColor('#000000');

    yPos += 50;
    
    // Company name
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text(company.companyName || 'Company Name', 50, yPos);
    
    yPos += 20;
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#6B7280');
    
    if (company.registeredAddress) {
      doc.text(company.registeredAddress, 50, yPos);
      yPos += 14;
    }
    if (company.email) {
      doc.text(company.email, 50, yPos);
      yPos += 14;
    }
    if (company.phone) {
      doc.text(company.phone, 50, yPos);
    }

    // Quotation title and number (right side)
    doc.fillColor('#3B82F6')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text('QUOTATION', 400, 50, { align: 'right', width: 145 });
    
    doc.fillColor('#1F2937')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(quotation.number, 400, 85, { align: 'right', width: 145 });

    // Status badge
    const status = quotation.status?.toUpperCase() || 'DRAFT';
    const statusColor = getStatusColor(quotation.status);
    const statusWidth = doc.widthOfString(status, { fontSize: 9 }) + 12;
    
    doc.roundedRect(545 - statusWidth, 110, statusWidth, 18, 9)
      .fillColor(statusColor)
      .fill()
      .fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(status, 545 - statusWidth + 6, 115, { width: statusWidth - 12 })
      .fillColor('#000000');
  };

  // Add document details section
  const addDocumentDetails = (yStart) => {
    let yPos = yStart;
    
    // Background box for details
    doc.rect(50, yPos, 495, 80)
      .fillColor('#F9FAFB')
      .fill()
      .fillColor('#000000');

    yPos += 15;
    const detailWidth = 120;
    const startX = 50;
    
    // Quote For
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6B7280')
      .text('QUOTE FOR', startX, yPos, { width: detailWidth });
    yPos += 12;
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text(quotation.client_name || 'N/A', startX, yPos, { width: detailWidth });
    if (quotation.client_email) {
      yPos += 14;
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#6B7280')
        .text(quotation.client_email, startX, yPos, { width: detailWidth });
    }

    // Issue Date
    yPos = yStart + 15;
    const col2X = startX + detailWidth + 20;
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6B7280')
      .text('ISSUE DATE', col2X, yPos, { width: detailWidth });
    yPos += 12;
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text(formatDate(quotation.issue_date), col2X, yPos, { width: detailWidth });

    // Valid Until
    yPos = yStart + 15;
    const col3X = col2X + detailWidth + 20;
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6B7280')
      .text('VALID UNTIL', col3X, yPos, { width: detailWidth });
    yPos += 12;
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1F2937')
      .text(formatDate(quotation.expiry_date), col3X, yPos, { width: detailWidth });

    // Total Amount
    yPos = yStart + 15;
    const col4X = col3X + detailWidth + 20;
    doc.fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#6B7280')
      .text('TOTAL AMOUNT', col4X, yPos, { width: detailWidth });
    yPos += 12;
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#3B82F6')
      .text(formatCurrencyValue(quotation.total_amount || 0), col4X, yPos, { width: detailWidth });
    yPos += 16;
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text(documentCurrency, col4X, yPos, { width: detailWidth });
    
    if (showExchangeRate) {
      yPos += 12;
      doc.fontSize(7)
        .fillColor('#9CA3AF')
        .text(`1 ${documentCurrency} = ${parseFloat(quotation.exchange_rate || 1).toFixed(4)} ${baseCurrency}`, col4X, yPos, { width: detailWidth });
    }

    return yStart + 100;
  };

  // Add line items table
  const addLineItems = (yStart) => {
    let yPos = yStart + 10;
    
    // Table header background
    doc.rect(50, yPos, 495, 25)
      .fillColor('#F3F4F6')
      .fill()
      .fillColor('#000000');

    yPos += 8;
    
    // Table headers
    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#6B7280')
      .text('DESCRIPTION', 60, yPos, { width: 250 });
    doc.text('QTY', 320, yPos, { width: 60, align: 'center' });
    doc.text('PRICE', 390, yPos, { width: 80, align: 'right' });
    doc.text('TOTAL', 480, yPos, { width: 55, align: 'right' });
    
    yPos += 20;
    
    // Table border
    doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#E5E7EB').lineWidth(1).stroke();

    yPos += 10;

    // Line items
    doc.font('Helvetica').fontSize(9).fillColor('#1F2937');
    const items = quotation.items || [];
    
    items.forEach((item) => {
      const itemData = toCamelCase(item);
      const name = itemData.name || '';
      const description = itemData.description || '';
      const quantity = parseFloat(itemData.quantity || 0);
      const price = parseFloat(itemData.price || 0);
      const discountPercent = parseFloat(itemData.discountPercent || 0);
      const taxPercent = parseFloat(itemData.taxPercent || 0);
      
      // Calculate line total
      const itemSubtotal = quantity * price;
      const discountAmount = itemSubtotal * discountPercent / 100;
      const afterDiscount = itemSubtotal - discountAmount;
      const taxAmount = afterDiscount * taxPercent / 100;
      const lineTotal = afterDiscount + taxAmount;

      // Item name
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
      doc.text(name, 60, yPos, { width: 250 });
      
      // Description if exists
      if (description) {
        yPos += 12;
        doc.font('Helvetica').fontSize(8).fillColor('#6B7280');
        doc.text(description, 60, yPos, { width: 250 });
        yPos -= 12;
      }

      // Quantity with UOM
      doc.font('Helvetica').fontSize(9).fillColor('#374151');
      const qtyText = `${quantity.toFixed(2)} ${itemData.uomCode || 'PC'}`;
      doc.text(qtyText, 320, yPos, { width: 60, align: 'center' });

      // Price
      doc.text(formatCurrencyValue(price), 390, yPos, { width: 80, align: 'right' });

      // Line total
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
      doc.text(formatCurrencyValue(lineTotal), 480, yPos, { width: 55, align: 'right' });
      
      yPos += 20;
      if (description) yPos += 8;
      
      // Row separator
      doc.moveTo(50, yPos - 5).lineTo(545, yPos - 5).strokeColor('#F3F4F6').lineWidth(0.5).stroke();
    });

    return yPos + 10;
  };

  // Add totals section
  const addTotals = (yStart) => {
    let yPos = yStart + 10;
    const totalsX = 400;
    const totalsWidth = 145;

    // Calculate totals
    const subtotal = parseFloat(quotation.subtotal || 0);
    const discount = parseFloat(quotation.discount_total || 0);
    const tax = parseFloat(quotation.tax_total || 0);
    const total = parseFloat(quotation.total_amount || 0);

    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    
    // Subtotal
    doc.text('Subtotal', totalsX, yPos, { width: totalsWidth, align: 'right' });
    doc.text(formatCurrencyValue(subtotal), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
    yPos += 18;

    // Discount
    if (discount > 0) {
      doc.text('Discount', totalsX, yPos, { width: totalsWidth, align: 'right' });
      doc.fillColor('#10B981');
      doc.text(`-${formatCurrencyValue(discount)}`, totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
      doc.fillColor('#374151');
      yPos += 18;
    }

    // Tax
    if (tax > 0) {
      const taxLabel = company.defaultTaxName 
        ? `Tax (${company.defaultTaxName} ${company.defaultTaxRate || 0}%)`
        : 'Tax';
      doc.text(taxLabel, totalsX, yPos, { width: totalsWidth, align: 'right' });
      doc.text(formatCurrencyValue(tax), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
      yPos += 18;
    }

    // Exchange rate if applicable
    if (showExchangeRate) {
      yPos += 8;
      doc.moveTo(totalsX, yPos).lineTo(totalsX + totalsWidth, yPos).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      yPos += 12;
      doc.fontSize(8).fillColor('#9CA3AF');
      doc.text(`1 ${documentCurrency} = ${parseFloat(quotation.exchange_rate || 1).toFixed(4)} ${baseCurrency}`, totalsX, yPos, { width: totalsWidth, align: 'right' });
      yPos += 12;
    }

    // Divider
    doc.moveTo(totalsX, yPos).lineTo(totalsX + totalsWidth, yPos).strokeColor('#E5E7EB').lineWidth(1).stroke();
    yPos += 12;

    // Total
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1F2937');
    doc.text('Total', totalsX, yPos, { width: totalsWidth, align: 'right' });
    doc.fontSize(16).fillColor('#3B82F6');
    doc.text(formatCurrencyValue(total), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });

    return yPos + 30;
  };

  // Build PDF
  addHeader();
  const detailsEnd = addDocumentDetails(140);
  const itemsEnd = addLineItems(detailsEnd);
  const totalsEnd = addTotals(itemsEnd);

  // Add notes and terms
  let notesY = totalsEnd + 20;
  if (quotation.notes) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
    doc.text('Notes:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    doc.text(quotation.notes, 50, notesY, { width: 495, lineGap: 4 });
    notesY += 30;
  }

  if (quotation.terms) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
    doc.text('Terms & Conditions:', 50, notesY);
    notesY += 15;
    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    doc.text(quotation.terms, 50, notesY, { width: 495, lineGap: 4 });
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
  try {
    // Get document via share link
    const documentData = await getDocumentByShareLink(token);
    
    if (!documentData || documentData.type !== 'quotation') {
      throw new Error('QUOTATION_NOT_FOUND');
    }

    const quotation = documentData.document;

    // Get user_id from quotation to fetch company settings
    const userId = quotation.user_id;
    if (!userId) {
      throw new Error('USER_ID_NOT_FOUND');
    }
    
    const settings = await getOrCreateSettings(userId);
    const company = toCamelCase(settings);
    
    // Get default tax if available
    try {
      const defaultTax = await getDefaultTax(userId);
      if (defaultTax) {
        company.defaultTax = toCamelCase(defaultTax);
      }
    } catch (taxError) {
      // If tax lookup fails, continue without it
      console.warn('Could not load default tax:', taxError);
    }

    // Get currency info
    const documentCurrency = quotation.currency || company.currency || 'MVR';
    const baseCurrency = company.baseCurrency || 'USD';
    const currencySymbol = getCurrencySymbol(documentCurrency);
    const showExchangeRate = quotation.exchange_rate && documentCurrency !== baseCurrency;

    // Create PDF with better margins
    const doc = new PDFDocument({ 
      margin: 40, 
      size: 'A4',
      info: {
        Title: `Quotation ${quotation.number}`,
        Author: company.companyName || 'Company',
        Subject: 'Quotation',
      }
    });

    // Helper to format currency
    const formatCurrencyValue = (amount) => {
      const formatted = parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `${formatted} ${currencySymbol}`;
    };

    // Helper to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    // Helper to get status color
    const getStatusColor = (status) => {
      const colors = {
        draft: '#6B7280',
        sent: '#3B82F6',
        accepted: '#10B981',
        rejected: '#EF4444',
        expired: '#EF4444',
      };
      return colors[status?.toLowerCase()] || '#6B7280';
    };

    // Add branded header section
    const addHeader = () => {
    // Header background (slate-50: #F1F5F9)
    const headerHeight = 130;
    doc.rect(0, 0, 595, headerHeight)
      .fillColor('#F1F5F9')
      .fill()
      .fillColor('#000000');

    // Bottom border for header
    doc.moveTo(0, headerHeight).lineTo(595, headerHeight).strokeColor('#E2E8F0').lineWidth(1).stroke();

    let yPos = 50;

    // Company branding area (left side)
    // Company icon placeholder (rounded square with blue background)
    const iconSize = 48;
    const iconX = 50;
    const iconY = yPos;
    const borderRadius = 12;
    
    // Draw rounded rectangle for icon (using regular rect for compatibility)
    doc.rect(iconX, iconY, iconSize, iconSize)
      .fillColor('#3B82F6')
      .fill();
    
    doc.fillColor('#FFFFFF')
      .fontSize(28)
      .text('B', iconX + iconSize/2, iconY + iconSize/2 - 8, { align: 'center', width: iconSize })
      .fillColor('#000000');

    yPos += 58;
    
    // Company name (larger, text-xl equivalent)
    doc.fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(company.companyName || 'Company Name', 50, yPos);
    
    yPos += 22;
    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#64748B');
    
    if (company.registeredAddress) {
      doc.text(company.registeredAddress, 50, yPos);
      yPos += 16;
    }
    if (company.email) {
      doc.text(company.email, 50, yPos);
      yPos += 16;
    }
    if (company.phone) {
      doc.text(company.phone, 50, yPos);
    }

    // Quotation title and number (right side)
    doc.fillColor('#3B82F6')
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('QUOTATION', 400, 50, { align: 'right', width: 145 });
    
    doc.fillColor('#0F172A')
      .fontSize(26)
      .font('Helvetica-Bold')
      .text(quotation.number, 400, 90, { align: 'right', width: 145 });

    // Status badge with border and dot
    const status = quotation.status?.toUpperCase() || 'DRAFT';
    const statusColor = getStatusColor(quotation.status);
    
    // Set font before calculating width
    doc.fontSize(9).font('Helvetica-Bold');
    const statusTextWidth = doc.widthOfString(status);
    const dotSize = 6;
    const statusPadding = 12;
    const statusWidth = statusTextWidth + statusPadding + dotSize + 6; // dot + spacing + padding
    const statusHeight = 20;
    const statusX = 545 - statusWidth;
    const statusY = 115;
    
    // Draw rounded rectangle for badge background (using regular rect)
    doc.rect(statusX, statusY, statusWidth, statusHeight)
      .fillColor(statusColor)
      .fill();
    
    // Draw border
    doc.rect(statusX, statusY, statusWidth, statusHeight)
      .strokeColor('#E2E8F0')
      .lineWidth(1)
      .stroke();
    
    // Draw dot indicator
    doc.circle(statusX + 8, statusY + statusHeight/2, dotSize/2)
      .fillColor('#FFFFFF')
      .fill();
    
    // Status text
    doc.fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(status, statusX + dotSize + 10, statusY + 6, { width: statusTextWidth })
      .fillColor('#000000');
    };

    // Add document details section
    const addDocumentDetails = (yStart) => {
      let yPos = yStart;
      
      // Background box for details (slate-50)
      const detailsHeight = 90;
      // Draw rectangle background
      doc.rect(50, yPos, 495, detailsHeight)
        .fillColor('#F1F5F9')
        .fill()
        .fillColor('#000000');

      yPos += 20;
      const detailWidth = 110;
      const startX = 60;
      
      // Quote For
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#64748B')
        .text('QUOTE FOR', startX, yPos, { width: detailWidth });
      yPos += 13;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .text(quotation.client_name || 'N/A', startX, yPos, { width: detailWidth });
      if (quotation.client_email) {
        yPos += 15;
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#64748B')
          .text(quotation.client_email, startX, yPos, { width: detailWidth });
      }

      // Issue Date
      yPos = yStart + 20;
      const col2X = startX + detailWidth + 25;
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#64748B')
        .text('ISSUE DATE', col2X, yPos, { width: detailWidth });
      yPos += 13;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .text(formatDate(quotation.issue_date), col2X, yPos, { width: detailWidth });

      // Valid Until
      yPos = yStart + 20;
      const col3X = col2X + detailWidth + 25;
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#64748B')
        .text('VALID UNTIL', col3X, yPos, { width: detailWidth });
      yPos += 13;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .text(formatDate(quotation.expiry_date), col3X, yPos, { width: detailWidth });

      // Total Amount
      yPos = yStart + 20;
      const col4X = col3X + detailWidth + 25;
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#64748B')
        .text('TOTAL AMOUNT', col4X, yPos, { width: detailWidth });
      yPos += 13;
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#3B82F6')
        .text(formatCurrencyValue(quotation.total_amount || 0), col4X, yPos, { width: detailWidth });
      yPos += 18;
      
      // Currency code badge
      doc.fontSize(8).font('Helvetica');
      const currencyCodeWidth = doc.widthOfString(documentCurrency) + 8;
      doc.rect(col4X, yPos - 2, currencyCodeWidth, 16)
        .fillColor('#F1F5F9')
        .fill();
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#64748B')
        .text(documentCurrency, col4X + 4, yPos, { width: currencyCodeWidth - 8 });
      
      if (showExchangeRate) {
        yPos += 18;
        doc.fontSize(7)
          .fillColor('#94A3B8')
          .text(`1 ${documentCurrency} = ${parseFloat(quotation.exchange_rate || 1).toFixed(4)} ${baseCurrency}`, col4X, yPos, { width: detailWidth });
      }

      return yStart + 110;
    };

    // Add line items table
    const addLineItems = (yStart) => {
      let yPos = yStart + 15;
      
      // Table header background (slate-50)
      const headerHeight = 28;
      doc.rect(50, yPos, 495, headerHeight)
        .fillColor('#F1F5F9')
        .fill()
        .fillColor('#000000');

      yPos += 10;
      
      // Table headers
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#64748B')
        .text('DESCRIPTION', 60, yPos, { width: 250 });
      doc.text('QTY', 320, yPos, { width: 60, align: 'center' });
      doc.text('PRICE', 390, yPos, { width: 80, align: 'right' });
      doc.text('TOTAL', 480, yPos, { width: 55, align: 'right' });
      
      yPos += 22;
      
      // Table border
      doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#E2E8F0').lineWidth(1).stroke();

      yPos += 12;

      // Line items
      doc.font('Helvetica').fontSize(9).fillColor('#0F172A');
      const items = quotation.items || [];
      
      items.forEach((item) => {
        const itemData = toCamelCase(item);
        const name = itemData.name || '';
        const description = itemData.description || '';
        const quantity = parseFloat(itemData.quantity || 0);
        const price = parseFloat(itemData.price || 0);
        const discountPercent = parseFloat(itemData.discountPercent || 0);
        const taxPercent = parseFloat(itemData.taxPercent || 0);
        
        // Calculate line total
        const itemSubtotal = quantity * price;
        const discountAmount = itemSubtotal * discountPercent / 100;
        const afterDiscount = itemSubtotal - discountAmount;
        const taxAmount = afterDiscount * taxPercent / 100;
        const lineTotal = afterDiscount + taxAmount;

        // Item name
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
        doc.text(name, 60, yPos, { width: 250 });
        
        // Description if exists
        if (description) {
          yPos += 13;
          doc.font('Helvetica').fontSize(9).fillColor('#64748B');
          doc.text(description, 60, yPos, { width: 250 });
          yPos -= 13;
        }

        // Quantity with UOM
        doc.font('Helvetica').fontSize(10).fillColor('#334155');
        const qtyText = `${quantity.toFixed(2)} ${itemData.uomCode || 'PC'}`;
        doc.text(qtyText, 320, yPos, { width: 60, align: 'center' });

        // Price
        doc.text(formatCurrencyValue(price), 390, yPos, { width: 80, align: 'right' });

        // Line total
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
        doc.text(formatCurrencyValue(lineTotal), 480, yPos, { width: 55, align: 'right' });
        
        yPos += 22;
        if (description) yPos += 6;
        
        // Row separator (lighter color)
        doc.moveTo(50, yPos - 6).lineTo(545, yPos - 6).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
      });

      return yPos + 10;
    };

    // Add totals section
    const addTotals = (yStart) => {
      let yPos = yStart + 10;
    const totalsX = 400;
    const totalsWidth = 145;

    // Calculate totals
    const subtotal = parseFloat(quotation.subtotal || 0);
    const discount = parseFloat(quotation.discount_total || 0);
    const tax = parseFloat(quotation.tax_total || 0);
    const total = parseFloat(quotation.total_amount || 0);

    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    
    // Subtotal
    doc.text('Subtotal', totalsX, yPos, { width: totalsWidth, align: 'right' });
    doc.text(formatCurrencyValue(subtotal), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
    yPos += 18;

    // Discount
    if (discount > 0) {
      doc.text('Discount', totalsX, yPos, { width: totalsWidth, align: 'right' });
      doc.fillColor('#10B981');
      doc.text(`-${formatCurrencyValue(discount)}`, totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
      doc.fillColor('#334155');
      yPos += 18;
    }

    // Tax
    if (tax > 0) {
      // Get tax rate from company settings
      const taxRate = parseFloat(company.defaultTaxRate || 0);
      const taxName = company.defaultTax?.name || 'GST';
      const taxLabel = taxRate > 0 ? `Tax (${taxName} ${taxRate.toFixed(2)}%)` : 'Tax';
      doc.text(taxLabel, totalsX, yPos, { width: totalsWidth, align: 'right' });
      doc.text(formatCurrencyValue(tax), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });
      yPos += 18;
    }

    // Exchange rate if applicable
    if (showExchangeRate) {
      yPos += 8;
      doc.moveTo(totalsX, yPos).lineTo(totalsX + totalsWidth, yPos).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      yPos += 12;
      doc.fontSize(8).fillColor('#94A3B8');
      doc.text(`1 ${documentCurrency} = ${parseFloat(quotation.exchange_rate || 1).toFixed(4)} ${baseCurrency}`, totalsX, yPos, { width: totalsWidth, align: 'right' });
      yPos += 12;
    }

    // Divider (lighter color)
    doc.moveTo(totalsX, yPos).lineTo(totalsX + totalsWidth, yPos).strokeColor('#E2E8F0').lineWidth(1).stroke();
    yPos += 14;

    // Total
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A');
    doc.text('Total', totalsX, yPos, { width: totalsWidth, align: 'right' });
    doc.fontSize(20).fillColor('#3B82F6');
    doc.text(formatCurrencyValue(total), totalsX + 10, yPos, { width: totalsWidth - 10, align: 'right' });

      return yPos + 30;
    };

    // Build PDF
    addHeader();
    const detailsEnd = addDocumentDetails(150);
    const itemsEnd = addLineItems(detailsEnd);
    const totalsEnd = addTotals(itemsEnd);

    // Add notes and terms
    let notesY = totalsEnd + 20;
    if (quotation.notes) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
      doc.text('Notes:', 50, notesY);
      notesY += 15;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      doc.text(quotation.notes, 50, notesY, { width: 495, lineGap: 4 });
      notesY += 30;
    }

    if (quotation.terms) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
      doc.text('Terms & Conditions:', 50, notesY);
      notesY += 15;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      doc.text(quotation.terms, 50, notesY, { width: 495, lineGap: 4 });
    }

    return doc;
  } catch (error) {
    console.error('Error in generateQuotationPDFFromToken:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
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



