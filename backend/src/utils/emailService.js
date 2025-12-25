import nodemailer from 'nodemailer';

/**
 * Create email transporter
 * Uses environment variables for SMTP configuration
 */
const createTransporter = () => {
  // If SMTP is configured, use it; otherwise use a test account
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // For development, use console logging instead of actual email
  return {
    sendMail: async (options) => {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        html: options.html ? 'HTML content (truncated)' : undefined,
        text: options.text,
      });
      return { messageId: 'dev-mode-message-id' };
    },
  };
};

const transporter = createTransporter();

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>} - Send result
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@hisaabu.com';

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generate quotation email template
 * @param {Object} quotation - Quotation data
 * @param {Object} client - Client data
 * @param {Object} company - Company settings
 * @param {string} shareLink - Optional share link
 * @returns {string} - HTML email template
 */
export const generateQuotationEmailTemplate = (quotation, client, company, shareLink = null) => {
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColors = {
    draft: '#6B7280',
    sent: '#3B82F6',
    accepted: '#10B981',
    expired: '#EF4444',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${quotation.number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${company.name || 'Hisaabu'}</h1>
    ${company.tagline ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${company.tagline}</p>` : ''}
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Quotation ${quotation.number}</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColors[quotation.status] || '#6B7280'}; font-weight: 600;">${quotation.status.toUpperCase()}</span></p>
      <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(quotation.issueDate)}</p>
      <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${formatDate(quotation.expiryDate)}</p>
      ${quotation.currency ? `<p style="margin: 5px 0;"><strong>Currency:</strong> ${quotation.currency}</p>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <h3 style="color: #374151; font-size: 18px; margin-bottom: 10px;">Client Details</h3>
      <p style="margin: 5px 0;"><strong>${client.name}</strong></p>
      ${client.email ? `<p style="margin: 5px 0;">Email: ${client.email}</p>` : ''}
      ${client.phone ? `<p style="margin: 5px 0;">Phone: ${client.phone}</p>` : ''}
      ${client.address ? `<p style="margin: 5px 0;">Address: ${client.address}</p>` : ''}
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
          ${quotation.items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.price, quotation.currency || 'USD')}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.lineTotal, quotation.currency || 'USD')}</td>
            </tr>
          `).join('')}
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
      <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 20px; font-weight: 600; color: #667eea;">
        <span><strong>Total:</strong></span>
        <span>${formatCurrency(quotation.totalAmount || 0, quotation.currency || 'USD')}</span>
      </div>
    </div>

    ${shareLink ? `
    <div style="margin: 30px 0; padding: 20px; background: #eff6ff; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: 600;">View Quotation Online</p>
      <a href="${shareLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Open Quotation</a>
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
      <p style="margin: 0;">This is an automated email from ${company.name || 'Hisaabu'}</p>
      ${company.email ? `<p style="margin: 5px 0;">Contact: ${company.email}</p>` : ''}
      ${company.phone ? `<p style="margin: 5px 0;">Phone: ${company.phone}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
};


