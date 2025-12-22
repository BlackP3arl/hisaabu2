import { sendEmail } from '../utils/emailService.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Test email endpoint (for debugging)
 * POST /api/v1/test-email
 */
export const testEmail = async (req, res) => {
  try {
    const { to, subject = 'Test Email from Hisaabu', message = 'This is a test email to verify email configuration.' } = req.body;

    if (!to) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Email address (to) is required',
        { to: ['Email address is required'] },
        422
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #3b82f6; }
          p { color: #333; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Test Email from Hisaabu</h1>
          <p>${message}</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;

    console.log('📧 [TEST EMAIL] Sending test email to:', to);
    const result = await sendEmail({
      to,
      subject,
      html,
    });

    return successResponse(
      res,
      {
        message: 'Test email sent successfully',
        messageId: result.messageId,
        to,
        timestamp: new Date().toISOString(),
      },
      'Test email sent successfully',
      200
    );
  } catch (error) {
    console.error('❌ [TEST EMAIL] Error:', error.message);
    return errorResponse(
      res,
      'EMAIL_SEND_FAILED',
      error.message || 'Failed to send test email',
      { error: error.message },
      500
    );
  }
};

