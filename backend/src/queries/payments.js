import { query, getClient } from '../config/database.js';
import { getInvoiceById, calculateInvoiceStatus } from './invoices.js';

/**
 * Payment database queries
 */

/**
 * Get payment by ID
 */
export const getPaymentById = async (userId, paymentId) => {
  const result = await query(
    `SELECT p.*
     FROM payments p
     INNER JOIN invoices i ON p.invoice_id = i.id
     WHERE p.id = $1 AND i.user_id = $2`,
    [paymentId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Get all payments for an invoice
 */
export const getPaymentsByInvoiceId = async (userId, invoiceId) => {
  const result = await query(
    `SELECT p.*
     FROM payments p
     INNER JOIN invoices i ON p.invoice_id = i.id
     WHERE p.invoice_id = $1 AND i.user_id = $2
     ORDER BY payment_date DESC, created_at DESC`,
    [invoiceId, userId]
  );

  return result.rows;
};

/**
 * Create payment and update invoice totals
 */
export const createPayment = async (userId, invoiceId, paymentData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Verify invoice belongs to user
    const invoice = await getInvoiceById(userId, invoiceId);
    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND');
    }

    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    } = paymentData;

    // Validate payment amount doesn't exceed balance
    const balanceDue = parseFloat(invoice.balance_due || 0);
    if (amount > balanceDue) {
      throw new Error('PAYMENT_EXCEEDS_BALANCE');
    }

    // Insert payment
    const paymentResult = await client.query(
      `INSERT INTO payments (
        invoice_id, amount, payment_date, payment_method,
        reference_number, notes, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        invoiceId,
        amount,
        paymentDate,
        paymentMethod || null,
        referenceNumber || null,
        notes || null,
        userId,
      ]
    );

    const payment = paymentResult.rows[0];

    // Recalculate invoice totals (sum of all payments)
    const paymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoiceId]
    );

    const amountPaid = parseFloat(paymentsResult.rows[0].total_paid);
    const totalAmount = parseFloat(invoice.total_amount);
    const newBalanceDue = totalAmount - amountPaid;

    // Calculate status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0);

    let newStatus = invoice.status;
    if (amountPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      if (dueDate < today && newBalanceDue > 0) {
        newStatus = 'overdue';
      } else {
        newStatus = 'partial';
      }
    } else if (dueDate < today && newBalanceDue > 0) {
      newStatus = 'overdue';
    }

    // Update invoice
    await client.query(
      `UPDATE invoices 
       SET amount_paid = $1, 
           balance_due = $2, 
           status = $3,
           paid_at = CASE WHEN $1 >= total_amount THEN NOW() ELSE paid_at END,
           updated_at = NOW()
       WHERE id = $4`,
      [amountPaid, newBalanceDue, newStatus, invoiceId]
    );

    await client.query('COMMIT');

    // Get updated invoice
    const updatedInvoice = await getInvoiceById(userId, invoiceId);

    return {
      payment,
      invoice: updatedInvoice,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update payment and recalculate invoice totals
 */
export const updatePayment = async (userId, invoiceId, paymentId, paymentData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Verify payment belongs to user's invoice
    const payment = await getPaymentById(userId, paymentId);
    if (!payment || payment.invoice_id !== invoiceId) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    // Get invoice
    const invoice = await getInvoiceById(userId, invoiceId);
    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND');
    }

    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes,
    } = paymentData;

    // If amount is being updated, validate it
    if (amount !== undefined) {
      // Calculate what balance would be without this payment
      const currentPayments = await client.query(
        'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1 AND id != $2',
        [invoiceId, paymentId]
      );
      const otherPaymentsTotal = parseFloat(currentPayments.rows[0].total_paid);
      const totalAmount = parseFloat(invoice.total_amount);
      const maxAllowed = totalAmount - otherPaymentsTotal;

      if (amount > maxAllowed) {
        throw new Error('PAYMENT_EXCEEDS_BALANCE');
      }
    }

    // Update payment
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(amount);
    }
    if (paymentDate !== undefined) {
      fields.push(`payment_date = $${paramIndex++}`);
      values.push(paymentDate);
    }
    if (paymentMethod !== undefined) {
      fields.push(`payment_method = $${paramIndex++}`);
      values.push(paymentMethod || null);
    }
    if (referenceNumber !== undefined) {
      fields.push(`reference_number = $${paramIndex++}`);
      values.push(referenceNumber || null);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(notes || null);
    }

    if (fields.length > 0) {
      values.push(paymentId);
      await client.query(
        `UPDATE payments 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    // Recalculate invoice totals
    const paymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoiceId]
    );

    const amountPaid = parseFloat(paymentsResult.rows[0].total_paid);
    const totalAmount = parseFloat(invoice.total_amount);
    const newBalanceDue = totalAmount - amountPaid;

    // Calculate status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0);

    let newStatus = invoice.status;
    if (amountPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      if (dueDate < today && newBalanceDue > 0) {
        newStatus = 'overdue';
      } else {
        newStatus = 'partial';
      }
    } else if (dueDate < today && newBalanceDue > 0) {
      newStatus = 'overdue';
    } else {
      newStatus = 'sent';
    }

    // Update invoice
    await client.query(
      `UPDATE invoices 
       SET amount_paid = $1, 
           balance_due = $2, 
           status = $3,
           paid_at = CASE WHEN $1 >= total_amount THEN COALESCE(paid_at, NOW()) ELSE NULL END,
           updated_at = NOW()
       WHERE id = $4`,
      [amountPaid, newBalanceDue, newStatus, invoiceId]
    );

    await client.query('COMMIT');

    // Get updated payment and invoice
    const updatedPayment = await getPaymentById(userId, paymentId);
    const updatedInvoice = await getInvoiceById(userId, invoiceId);

    return {
      payment: updatedPayment,
      invoice: updatedInvoice,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete payment and recalculate invoice totals
 */
export const deletePayment = async (userId, invoiceId, paymentId) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Verify payment belongs to user's invoice
    const payment = await getPaymentById(userId, paymentId);
    if (!payment || payment.invoice_id !== invoiceId) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    // Get invoice
    const invoice = await getInvoiceById(userId, invoiceId);
    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND');
    }

    // Delete payment
    await client.query(
      'DELETE FROM payments WHERE id = $1',
      [paymentId]
    );

    // Recalculate invoice totals
    const paymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoiceId]
    );

    const amountPaid = parseFloat(paymentsResult.rows[0].total_paid);
    const totalAmount = parseFloat(invoice.total_amount);
    const newBalanceDue = totalAmount - amountPaid;

    // Calculate status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0);

    let newStatus = invoice.status;
    if (amountPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      if (dueDate < today && newBalanceDue > 0) {
        newStatus = 'overdue';
      } else {
        newStatus = 'partial';
      }
    } else if (dueDate < today && newBalanceDue > 0) {
      newStatus = 'overdue';
    } else {
      newStatus = 'sent';
    }

    // Update invoice
    await client.query(
      `UPDATE invoices 
       SET amount_paid = $1, 
           balance_due = $2, 
           status = $3,
           paid_at = NULL,
           updated_at = NOW()
       WHERE id = $4`,
      [amountPaid, newBalanceDue, newStatus, invoiceId]
    );

    await client.query('COMMIT');

    // Get updated invoice
    const updatedInvoice = await getInvoiceById(userId, invoiceId);

    return updatedInvoice;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


