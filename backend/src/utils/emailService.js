import { Resend } from 'resend';

/**
 * Initialize Resend client
 * Uses RESEND_API_KEY from environment variables
 */
let resend = null;

const initializeResend = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (apiKey && apiKey.trim() && apiKey !== 're_your_api_key_here') {
      try {
        resend = new Resend(apiKey);
      } catch (error) {
        console.error('❌ [RESEND] Failed to initialize Resend client:', error.message);
        resend = null;
      }
    }
  }
  return resend;
};

/**
 * Send email using Resend API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email (can be string or array)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {Array} options.attachments - Optional attachments array
 * @returns {Promise<Object>} - Send result with messageId
 */
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    // Initialize Resend client
    const resendClient = initializeResend();

    // If no API key is set, use dev mode (console logging)
    if (!resendClient) {
      console.log('📧 [DEV MODE] Email would be sent:', {
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html ? 'HTML content (truncated)' : undefined,
        text,
        attachments: attachments ? `${attachments.length} attachment(s)` : undefined,
      });
      return { 
        messageId: 'dev-mode-message-id',
        id: 'dev-mode-message-id'
      };
    }

    // Get sender email from environment or use default
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Prepare email payload for Resend
    const emailPayload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    // Add text version if provided, otherwise generate from HTML
    if (text) {
      emailPayload.text = text;
    } else if (html) {
      // Strip HTML tags for plain text version
      emailPayload.text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    // Send email via Resend
    let result;
    try {
      result = await resendClient.emails.send(emailPayload);
    } catch (sendError) {
      console.error('❌ [RESEND] Exception sending email:', sendError);
      throw new Error(`Resend API error: ${sendError.message || 'Unknown error'}`);
    }

    // Handle Resend response format
    const { data, error } = result || {};

    if (error) {
      console.error('❌ [RESEND] Error sending email:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send email';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.name === 'validation_error') {
        errorMessage = 'Invalid email configuration. Please check your Resend API key and sender email.';
      } else if (error.name === 'rate_limit_exceeded') {
        errorMessage = 'Email rate limit exceeded. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    if (!data || !data.id) {
      console.error('❌ [RESEND] Unexpected response format:', result);
      throw new Error('Invalid response from Resend API');
    }

    console.log('✅ [RESEND] Email sent successfully:', data.id);
    
    // Return result in format compatible with existing code
    return {
      messageId: data.id,
      id: data.id,
      ...data
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generate quotation email template
 * @param {Object} params - Template parameters
 * @param {Object} params.quotation - Quotation data
 * @param {Object} params.client - Client data
 * @param {Object} params.company - Company settings
 * @param {string} params.shareUrl - Optional share URL
 * @param {string} params.acceptUrl - Optional accept URL
 * @param {string} params.rejectUrl - Optional reject URL
 * @returns {string} - HTML email template
 */
export const generateQuotationEmailTemplate = ({ quotation, client, company, shareUrl, acceptUrl, rejectUrl }) => {
  // Ensure all parameters are defined
  if (!quotation) {
    throw new Error('Quotation data is required');
  }
  if (!client) {
    throw new Error('Client data is required');
  }
  if (!company) {
    company = {};
  }

  const formatCurrency = (amount, currency = 'USD') => {
    try {
      const numAmount = parseFloat(amount) || 0;
      // Format with comma separation for thousands
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numAmount);
      return formatted;
    } catch (e) {
      // Fallback with comma separation
      const numAmount = parseFloat(amount || 0);
      return `${currency === 'MVR' ? 'Rf' : '$'}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return String(date);
    }
  };

  const statusColors = {
    draft: '#6B7280',
    sent: '#3B82F6',
    accepted: '#10B981',
    expired: '#EF4444',
  };

  // Get company name - handle both camelCase and snake_case
  const companyName = company.companyName || company.company_name || company.name || 'Hisaabu';
  const companyTagline = company.tagline || '';
  const companyEmail = company.email || '';
  const companyPhone = company.phone || '';

  // Get quotation fields with fallbacks
  const quotationNumber = quotation.number || quotation.quotationNumber || 'N/A';
  const quotationStatus = quotation.status || 'draft';
  const quotationIssueDate = quotation.issueDate || quotation.issue_date;
  const quotationExpiryDate = quotation.expiryDate || quotation.expiry_date;
  const quotationCurrency = quotation.currency || 'USD';

  // Get client fields with fallbacks
  const clientName = client.name || 'Client';
  const clientEmail = client.email || '';
  const clientPhone = client.phone || '';
  const clientAddress = client.address || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${quotationNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f6f6f8;">
  <div style="background: #135bec; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">${companyName}</h1>
    ${companyTagline ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${companyTagline}</p>` : ''}
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Quotation ${quotationNumber}</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColors[quotationStatus] || '#6B7280'}; font-weight: 600;">${String(quotationStatus).toUpperCase()}</span></p>
      <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(quotationIssueDate)}</p>
      <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${formatDate(quotationExpiryDate)}</p>
      ${quotationCurrency ? `<p style="margin: 5px 0;"><strong>Currency:</strong> ${quotationCurrency}</p>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Client Details</h3>
      <p style="margin: 5px 0;"><strong>${clientName}</strong></p>
      ${clientEmail ? `<p style="margin: 5px 0;">Email: ${clientEmail}</p>` : ''}
      ${clientPhone ? `<p style="margin: 5px 0;">Phone: ${clientPhone}</p>` : ''}
      ${clientAddress ? `<p style="margin: 5px 0;">Address: ${clientAddress}</p>` : ''}
    </div>

    ${quotation.items && quotation.items.length > 0 ? `
    <div style="margin: 20px 0;">
      <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.items.map(item => {
            // Handle both camelCase and snake_case
            const lineTotal = item.lineTotal || item.line_total || 0;
            return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name || 'Item'}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity || 0}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.price || 0, quotation.currency || 'USD')}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(lineTotal, quotation.currency || 'USD')}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div style="margin: 20px 0; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span><strong>Subtotal:</strong></span>
        <span>${formatCurrency(quotation.subtotal || 0, quotation.currency || 'USD')}</span>
      </div>
      ${quotation.discountTotal > 0 ? `
      <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #10b981;">
        <span><strong>Discount:</strong></span>
        <span>-${formatCurrency(quotation.discountTotal, quotation.currency || 'USD')}</span>
      </div>
      ` : ''}
      ${quotation.taxTotal > 0 ? `
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span><strong>Tax:</strong></span>
        <span>${formatCurrency(quotation.taxTotal, quotation.currency || 'USD')}</span>
      </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 20px; font-weight: 600; color: #135bec;">
        <span><strong>Total:</strong></span>
        <span>${formatCurrency(quotation.totalAmount || 0, quotation.currency || 'USD')}</span>
      </div>
    </div>

    ${shareUrl ? `
    <div style="margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 15px 0; color: #135bec; font-weight: 600;">View Quotation Online</p>
      <a href="${shareUrl}" style="display: inline-block; padding: 12px 24px; background: #135bec; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; box-shadow: 0 4px 6px rgba(19, 91, 236, 0.25);">Open Quotation</a>
    </div>
    ` : ''}

    ${quotation.notes ? `
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
      <h4 style="color: #374151; margin-top: 0; font-size: 16px;">Notes</h4>
      <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${quotation.notes}</p>
    </div>
    ` : ''}

    ${quotation.terms ? `
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 6px;">
      <h4 style="color: #374151; margin-top: 0; font-size: 16px;">Terms & Conditions</h4>
      <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${quotation.terms}</p>
    </div>
    ` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is an automated email from ${companyName}</p>
      ${companyEmail ? `<p style="margin: 5px 0;">Contact: ${companyEmail}</p>` : ''}
      ${companyPhone ? `<p style="margin: 5px 0;">Phone: ${companyPhone}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
};


