import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

/**
 * Share link database queries
 */

/**
 * Generate UUID v4 token
 */
export const generateToken = () => {
  return uuidv4();
};

/**
 * Get share link by token
 */
export const getShareLinkByToken = async (token) => {
  const result = await query(
    'SELECT * FROM share_links WHERE token = $1',
    [token]
  );

  return result.rows[0] || null;
};

/**
 * Get share link by token with document verification
 */
export const getShareLinkWithDocument = async (token, userId = null) => {
  const shareLink = await getShareLinkByToken(token);

  if (!shareLink) {
    return null;
  }

  // Verify document belongs to user if userId provided
  if (userId) {
    if (shareLink.document_type === 'invoice') {
      const invoiceResult = await query(
        'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
        [shareLink.document_id, userId]
      );
      if (invoiceResult.rows.length === 0) {
        return null;
      }
    } else if (shareLink.document_type === 'quotation') {
      const quotationResult = await query(
        'SELECT id FROM quotations WHERE id = $1 AND user_id = $2',
        [shareLink.document_id, userId]
      );
      if (quotationResult.rows.length === 0) {
        return null;
      }
    }
  }

  return shareLink;
};

/**
 * Create share link
 */
export const createShareLink = async (userId, shareLinkData) => {
  const {
    documentType,
    documentId,
    password,
    expiresAt,
  } = shareLinkData;

  // Verify document belongs to user
  if (documentType === 'invoice') {
    const invoiceResult = await query(
      'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );
    if (invoiceResult.rows.length === 0) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
  } else if (documentType === 'quotation') {
    const quotationResult = await query(
      'SELECT id FROM quotations WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );
    if (quotationResult.rows.length === 0) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
  } else {
    throw new Error('INVALID_DOCUMENT_TYPE');
  }

  // Generate token
  const token = generateToken();

  // Hash password if provided
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Insert share link
  const result = await query(
    `INSERT INTO share_links (
      token, document_type, document_id, password_hash, expires_at, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [token, documentType, documentId, passwordHash, expiresAt || null, true]
  );

  return result.rows[0];
};

/**
 * Verify share link password
 */
export const verifyShareLinkPassword = async (token, password) => {
  const shareLink = await getShareLinkByToken(token);

  if (!shareLink) {
    throw new Error('SHARE_LINK_NOT_FOUND');
  }

  if (!shareLink.password_hash) {
    // No password required
    return true;
  }

  const isValid = await bcrypt.compare(password, shareLink.password_hash);
  if (!isValid) {
    throw new Error('INVALID_PASSWORD');
  }

  return true;
};

/**
 * Increment view count
 */
export const incrementViewCount = async (token) => {
  await query(
    'UPDATE share_links SET view_count = view_count + 1 WHERE token = $1',
    [token]
  );
};

/**
 * Deactivate share link
 */
export const deactivateShareLink = async (userId, token) => {
  // Verify share link belongs to user's document
  const shareLink = await getShareLinkWithDocument(token, userId);
  if (!shareLink) {
    return null;
  }

  const result = await query(
    'UPDATE share_links SET is_active = false WHERE token = $1 RETURNING *',
    [token]
  );

  return result.rows[0];
};

/**
 * Get document by share link (for public access)
 */
export const getDocumentByShareLink = async (token) => {
  const shareLink = await getShareLinkByToken(token);

  if (!shareLink) {
    return null;
  }

  // Check if link is active
  if (!shareLink.is_active) {
    throw new Error('SHARE_LINK_INACTIVE');
  }

  // Check if expired
  if (shareLink.expires_at) {
    const expiresAt = new Date(shareLink.expires_at);
    expiresAt.setHours(23, 59, 59, 999); // End of day
    if (new Date() > expiresAt) {
      throw new Error('SHARE_LINK_EXPIRED');
    }
  }

  // Get document based on type
  if (shareLink.document_type === 'invoice') {
    const invoiceResult = await query(
      `SELECT 
        i.*,
        c.id as client_id,
        c.name as client_name,
        c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1`,
      [shareLink.document_id]
    );

    if (invoiceResult.rows.length === 0) {
      return null;
    }

    const invoice = invoiceResult.rows[0];

    // Get line items
    const itemsResult = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC, id ASC',
      [shareLink.document_id]
    );

    // Get payments
    const paymentsResult = await query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC',
      [shareLink.document_id]
    );

    invoice.items = itemsResult.rows;
    invoice.payments = paymentsResult.rows;

    return {
      type: 'invoice',
      document: invoice,
    };
  } else if (shareLink.document_type === 'quotation') {
    const quotationResult = await query(
      `SELECT 
        q.*,
        c.id as client_id,
        c.name as client_name,
        c.email as client_email
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = $1`,
      [shareLink.document_id]
    );

    if (quotationResult.rows.length === 0) {
      return null;
    }

    const quotation = quotationResult.rows[0];

    // Get line items
    const itemsResult = await query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC, id ASC',
      [shareLink.document_id]
    );

    quotation.items = itemsResult.rows;

    return {
      type: 'quotation',
      document: quotation,
    };
  }

  return null;
};



