import {
  createShareLink,
  getShareLinkByToken,
  getShareLinkWithDocument,
  verifyShareLinkPassword,
  incrementViewCount,
  deactivateShareLink,
  getDocumentByShareLink,
} from '../queries/shareLinks.js';
import { getOrCreateSettings } from '../queries/settings.js';
import { query } from '../config/database.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';

/**
 * Generate share link
 * POST /api/v1/share-links
 */
export const generateShareLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      documentType,
      documentId,
      password,
      expiresAt,
    } = req.body;

    // Validation
    if (!documentType || !['invoice', 'quotation'].includes(documentType)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Document type must be "invoice" or "quotation"',
        { documentType: ['Document type must be "invoice" or "quotation"'] },
        422
      );
    }

    if (!documentId || isNaN(parseInt(documentId))) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid document ID is required',
        { documentId: ['Document ID must be a valid number'] },
        422
      );
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Expiration date must be in the future',
        { expiresAt: ['Expiration date must be in the future'] },
        422
      );
    }

    // Create share link
    const shareLink = await createShareLink(userId, {
      documentType,
      documentId: parseInt(documentId),
      password: password || null,
      expiresAt: expiresAt || null,
    });

    // Transform response
    const transformed = toCamelCase(shareLink);
    transformed.hasPassword = !!shareLink.password_hash;
    transformed.url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${documentType}/${transformed.token}`;

    // Remove password hash from response
    delete transformed.passwordHash;

    return successResponse(
      res,
      {
        shareLink: transformed,
      },
      'Share link created successfully',
      201
    );
  } catch (error) {
    console.error('Generate share link error:', error);
    if (error.message === 'DOCUMENT_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Document not found',
        null,
        404
      );
    }
    if (error.message === 'INVALID_DOCUMENT_TYPE') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid document type',
        null,
        422
      );
    }
    throw error;
  }
};

/**
 * Get share link details
 * GET /api/v1/share-links/:token
 */
export const getShareLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.params;

    const shareLink = await getShareLinkWithDocument(token, userId);

    if (!shareLink) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }

    // Transform response
    const transformed = toCamelCase(shareLink);
    transformed.hasPassword = !!shareLink.password_hash;
    
    // Remove password hash from response
    delete transformed.passwordHash;

    return successResponse(
      res,
      {
        shareLink: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get share link error:', error);
    throw error;
  }
};

/**
 * Verify share link password
 * POST /api/v1/share-links/:token/verify
 */
export const verifyPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Password is required',
        { password: ['Password is required'] },
        422
      );
    }

    // Verify password
    await verifyShareLinkPassword(token, password);

    // Get document
    const documentData = await getDocumentByShareLink(token);

    if (!documentData) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Document not found',
        null,
        404
      );
    }

    // Increment view count
    await incrementViewCount(token);

    // Transform document
    const transformed = toCamelCase(documentData.document);
    if (documentData.type === 'invoice') {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
      transformed.payments = toCamelCaseArray(documentData.document.payments || []);
    } else {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
    }

    return successResponse(
      res,
      {
        document: transformed,
      },
      'Password verified',
      200
    );
  } catch (error) {
    console.error('Verify password error:', error);
    if (error.message === 'SHARE_LINK_NOT_FOUND') {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }
    if (error.message === 'INVALID_PASSWORD') {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Invalid password',
        null,
        401
      );
    }
    if (error.message === 'SHARE_LINK_INACTIVE') {
      return errorResponse(
        res,
        'GONE',
        'Share link is inactive',
        null,
        410
      );
    }
    if (error.message === 'SHARE_LINK_EXPIRED') {
      return errorResponse(
        res,
        'GONE',
        'Share link has expired',
        null,
        410
      );
    }
    throw error;
  }
};

/**
 * Deactivate share link
 * DELETE /api/v1/share-links/:token
 */
export const deactivate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.params;

    const deactivated = await deactivateShareLink(userId, token);

    if (!deactivated) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      null,
      'Share link deactivated successfully',
      200
    );
  } catch (error) {
    console.error('Deactivate share link error:', error);
    throw error;
  }
};

/**
 * Public share endpoint (no authentication)
 * GET /api/v1/public/share/:token
 */
export const publicShare = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    // Get share link
    const shareLink = await getShareLinkByToken(token);

    if (!shareLink) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }

    // Check if link is active
    if (!shareLink.is_active) {
      return errorResponse(
        res,
        'GONE',
        'Share link is inactive',
        null,
        410
      );
    }

    // Check if expired
    if (shareLink.expires_at) {
      const expiresAt = new Date(shareLink.expires_at);
      expiresAt.setHours(23, 59, 59, 999);
      if (new Date() > expiresAt) {
        return errorResponse(
          res,
          'GONE',
          'Share link has expired',
          null,
          410
        );
      }
    }

    // Check password if required
    if (shareLink.password_hash) {
      if (!password) {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          'Password required',
          null,
          401
        );
      }

      try {
        await verifyShareLinkPassword(token, password);
      } catch (error) {
        if (error.message === 'INVALID_PASSWORD') {
          return errorResponse(
            res,
            'UNAUTHORIZED',
            'Invalid password',
            null,
            401
          );
        }
        throw error;
      }
    }

    // Get document
    const documentData = await getDocumentByShareLink(token);

    if (!documentData) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Document not found',
        null,
        404
      );
    }

    // Increment view count
    await incrementViewCount(token);

    // Get company settings for branding
    let userId = null;
    if (documentData.type === 'invoice') {
      const invoiceResult = await query('SELECT user_id FROM invoices WHERE id = $1', [shareLink.document_id]);
      userId = invoiceResult.rows[0]?.user_id;
    } else {
      const quotationResult = await query('SELECT user_id FROM quotations WHERE id = $1', [shareLink.document_id]);
      userId = quotationResult.rows[0]?.user_id;
    }

    const companySettings = userId ? await getOrCreateSettings(userId) : null;

    // Transform document
    const transformed = toCamelCase(documentData.document);
    if (documentData.type === 'invoice') {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
      transformed.payments = toCamelCaseArray(documentData.document.payments || []);
    } else {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
    }

    // Transform company settings
    const company = companySettings ? toCamelCase(companySettings) : null;

    // Transform share link info (without sensitive data)
    const shareLinkInfo = toCamelCase(shareLink);
    shareLinkInfo.hasPassword = !!shareLink.password_hash;
    delete shareLinkInfo.passwordHash;

    return successResponse(
      res,
      {
        shareLink: shareLinkInfo,
        document: transformed,
        company,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Public share error:', error);
    throw error;
  }
};

/**
 * Public verify password endpoint (no authentication)
 * POST /api/v1/public/share/:token/verify
 */
export const publicVerifyPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Password is required',
        { password: ['Password is required'] },
        422
      );
    }

    // Get share link
    const shareLink = await getShareLinkByToken(token);

    if (!shareLink) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }

    // Check if link is active
    if (!shareLink.is_active) {
      return errorResponse(
        res,
        'GONE',
        'Share link is inactive',
        null,
        410
      );
    }

    // Check if expired
    if (shareLink.expires_at) {
      const expiresAt = new Date(shareLink.expires_at);
      expiresAt.setHours(23, 59, 59, 999);
      if (new Date() > expiresAt) {
        return errorResponse(
          res,
          'GONE',
          'Share link has expired',
          null,
          410
        );
      }
    }

    // Verify password
    try {
      await verifyShareLinkPassword(token, password);
    } catch (error) {
      if (error.message === 'INVALID_PASSWORD') {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          'Invalid password',
          null,
          401
        );
      }
      throw error;
    }

    // Get document
    const documentData = await getDocumentByShareLink(token);

    if (!documentData) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Document not found',
        null,
        404
      );
    }

    // Increment view count
    await incrementViewCount(token);

    // Get company settings for branding
    let userId = null;
    if (documentData.type === 'invoice') {
      const invoiceResult = await query('SELECT user_id FROM invoices WHERE id = $1', [shareLink.document_id]);
      userId = invoiceResult.rows[0]?.user_id;
    } else {
      const quotationResult = await query('SELECT user_id FROM quotations WHERE id = $1', [shareLink.document_id]);
      userId = quotationResult.rows[0]?.user_id;
    }

    const companySettings = userId ? await getOrCreateSettings(userId) : null;

    // Transform document
    const transformed = toCamelCase(documentData.document);
    if (documentData.type === 'invoice') {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
      transformed.payments = toCamelCaseArray(documentData.document.payments || []);
    } else {
      transformed.client = {
        id: documentData.document.client_id,
        name: documentData.document.client_name,
        email: documentData.document.client_email,
      };
      transformed.items = toCamelCaseArray(documentData.document.items || []);
    }

    // Transform company settings
    const company = companySettings ? toCamelCase(companySettings) : null;

    // Transform share link
    const shareLinkTransformed = toCamelCase(shareLink);
    shareLinkTransformed.hasPassword = !!shareLink.password_hash;
    delete shareLinkTransformed.passwordHash;

    return successResponse(
      res,
      {
        shareLink: shareLinkTransformed,
        document: transformed,
        company,
      },
      'Password verified',
      200
    );
  } catch (error) {
    console.error('Public verify password error:', error);
    throw error;
  }
};

/**
 * Public acknowledge endpoint (no authentication)
 * POST /api/v1/public/share/:token/acknowledge
 */
export const publicAcknowledge = async (req, res) => {
  try {
    const { token } = req.params;

    // Get share link
    const shareLink = await getShareLinkByToken(token);

    if (!shareLink) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Share link not found',
        null,
        404
      );
    }

    // Check if link is active
    if (!shareLink.is_active) {
      return errorResponse(
        res,
        'GONE',
        'Share link is inactive',
        null,
        410
      );
    }

    // Check if expired
    if (shareLink.expires_at) {
      const expiresAt = new Date(shareLink.expires_at);
      expiresAt.setHours(23, 59, 59, 999);
      if (new Date() > expiresAt) {
        return errorResponse(
          res,
          'GONE',
          'Share link has expired',
          null,
          410
        );
      }
    }

    // Increment view count and update last accessed
    await incrementViewCount(token);
    await query(
      'UPDATE share_links SET last_accessed_at = NOW() WHERE token = $1',
      [token]
    );

    return successResponse(
      res,
      null,
      'Document acknowledged',
      200
    );
  } catch (error) {
    console.error('Public acknowledge error:', error);
    throw error;
  }
};

