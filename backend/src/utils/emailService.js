import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email service utility
 * Uses Sendinblue/Brevo SMTP for sending emails
 */

// Create transporter for Sendinblue/Brevo
const createTransporter = () => {
  const smtpKey = process.env.SMTP_KEY;
  const smtpServer = process.env.SMTP_SERVER || 'smtp-relay.sendinblue.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || smtpKey; // Sendinblue uses API key as username
  const emailFrom = process.env.EMAIL_FROM || 'noreply@hisaabu.com';
  const emailFromName = process.env.EMAIL_FROM_NAME || 'Hisaabu';

  if (!smtpKey) {
    console.warn('SMTP_KEY not configured. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpKey,
    },
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @returns {Promise<Object>} - Send result
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured. Please set SMTP_KEY in environment variables.');
  }

  const emailFrom = process.env.EMAIL_FROM || 'noreply@hisaabu.com';
  const emailFromName = process.env.EMAIL_FROM_NAME || 'Hisaabu';

  try {
    const info = await transporter.sendMail({
      from: `"${emailFromName}" <${emailFrom}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Generate quotation email HTML template
 * @param {Object} options - Email template options
 * @param {Object} options.quotation - Quotation data
 * @param {Object} options.company - Company settings
 * @param {Object} options.client - Client data
 * @param {string} options.shareUrl - Secure share link URL
 * @param {string} options.acceptUrl - Accept quotation URL
 * @param {string} options.rejectUrl - Reject quotation URL
 * @returns {string} - HTML email template
 */
export const generateQuotationEmailTemplate = ({
  quotation,
  company,
  client,
  shareUrl,
  acceptUrl,
  rejectUrl,
}) => {
  const companyName = company?.companyName || company?.name || 'Company';
  const companyEmail = company?.email || '';
  const companyAddress = company?.address || '';
  const quotationNumber = quotation.number || '';
  const totalAmount = parseFloat(quotation.totalAmount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = quotation.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
  const issueDate = quotation.issueDate ? new Date(quotation.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';
  const expiryDate = quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation ${quotationNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Quotation ${quotationNumber}</h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">${companyName}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Dear ${client.name || 'Valued Client'},
              </p>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.7;">
                Thank you for your interest in our services. We are pleased to present you with the following quotation for your consideration.
              </p>

              <!-- Quotation Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quotation Number</p>
                          <p style="margin: 4px 0 0; color: #0f172a; font-size: 20px; font-weight: 700;">${quotationNumber}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Issue Date</p>
                          <p style="margin: 4px 0 0; color: #0f172a; font-size: 15px; font-weight: 500;">${issueDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Valid Until</p>
                          <p style="margin: 4px 0 0; color: #0f172a; font-size: 15px; font-weight: 500;">${expiryDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                          <p style="margin: 4px 0 0; color: #3b82f6; font-size: 24px; font-weight: 700;">${currencySymbol}${totalAmount} ${currency}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${acceptUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      ✓ Accept Quotation
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${rejectUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                      ✗ Reject Quotation
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${shareUrl}" style="display: inline-block; background-color: #ffffff; color: #3b82f6; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center; min-width: 200px; border: 2px solid #3b82f6;">
                      View Full Details
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Additional Info -->
              <p style="margin: 32px 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                You can view the complete quotation details, download the PDF, and manage your response using the links above.
              </p>

              ${quotation.notes ? `
              <div style="margin-top: 32px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 8px; color: #0f172a; font-size: 14px; font-weight: 600;">Additional Notes:</p>
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${quotation.notes}</p>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; font-weight: 600;">${companyName}</p>
              ${companyAddress ? `<p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">${companyAddress}</p>` : ''}
              ${companyEmail ? `<p style="margin: 0; color: #94a3b8; font-size: 13px;"><a href="mailto:${companyEmail}" style="color: #3b82f6; text-decoration: none;">${companyEmail}</a></p>` : ''}
              <p style="margin: 16px 0 0; color: #cbd5e1; font-size: 12px;">
                This email was sent by <strong>Hisaabu</strong> Invoice & Quotation Management System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

