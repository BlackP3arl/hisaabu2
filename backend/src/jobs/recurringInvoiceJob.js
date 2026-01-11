import cron from 'node-cron';
import { getDueRecurringInvoices, updateRecurringInvoiceGeneration } from '../queries/recurringInvoices.js';
import { createInvoice } from '../queries/invoices.js';
import { getInvoicePrefix } from '../queries/settings.js';
import { generateInvoiceNumber } from '../utils/numbering.js';
import { query } from '../config/database.js';
import { calculateNextGenerationDate, prepareInvoiceData } from '../utils/recurringInvoiceGenerator.js';

/**
 * Generate invoices from due recurring invoices
 */
const generateRecurringInvoices = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting recurring invoice generation job...`);

    // Get all due recurring invoices
    const dueRecurringInvoices = await getDueRecurringInvoices();

    if (dueRecurringInvoices.length === 0) {
      console.log('No recurring invoices due for generation.');
      return;
    }

    console.log(`Found ${dueRecurringInvoices.length} recurring invoice(s) due for generation.`);

    // Process each recurring invoice
    for (const recurringInvoice of dueRecurringInvoices) {
      try {
        // Skip if auto_bill is disabled
        if (recurringInvoice.auto_bill === 'disabled') {
          console.log(`Skipping recurring invoice ${recurringInvoice.id} (auto_bill is disabled)`);
          continue;
        }

        // Get the issue date (next_generation_date)
        const issueDate = new Date(recurringInvoice.next_generation_date);
        issueDate.setHours(0, 0, 0, 0);

        // Check if we've already passed the end date
        const endDate = new Date(recurringInvoice.end_date);
        endDate.setHours(0, 0, 0, 0);

        if (issueDate > endDate) {
          // Stop the recurring invoice as it has reached its end date
          await query(
            `UPDATE recurring_invoices 
             SET status = 'stopped', next_generation_date = NULL, updated_at = NOW()
             WHERE id = $1`,
            [recurringInvoice.id]
          );
          console.log(`Stopped recurring invoice ${recurringInvoice.id} (reached end date)`);
          continue;
        }

        // Prepare invoice data from template
        const invoiceData = prepareInvoiceData(recurringInvoice, issueDate);

        // Get invoice prefix and generate number
        const prefix = await getInvoicePrefix(recurringInvoice.user_id);
        const invoiceNumber = await generateInvoiceNumber(recurringInvoice.user_id, prefix, query);

        // Create the invoice
        const invoice = await createInvoice(
          recurringInvoice.user_id,
          invoiceData,
          invoiceData.items,
          invoiceNumber
        );

        // Set recurring_invoice_id on the created invoice
        await query(
          `UPDATE invoices 
           SET recurring_invoice_id = $1 
           WHERE id = $2`,
          [recurringInvoice.id, invoice.id]
        );

        console.log(`Generated invoice ${invoiceNumber} (ID: ${invoice.id}) from recurring invoice ${recurringInvoice.id}`);

        // Calculate next generation date
        const nextGenerationDate = calculateNextGenerationDate(
          recurringInvoice.frequency,
          issueDate
        );

        // Check if next generation date exceeds end date
        let finalNextDate = nextGenerationDate.toISOString().split('T')[0];
        if (nextGenerationDate > endDate) {
          // Stop the recurring invoice
          await query(
            `UPDATE recurring_invoices 
             SET status = 'stopped', next_generation_date = NULL, updated_at = NOW()
             WHERE id = $1`,
            [recurringInvoice.id]
          );
          console.log(`Stopped recurring invoice ${recurringInvoice.id} (next generation would exceed end date)`);
        } else {
          // Update last generated date and next generation date
          await updateRecurringInvoiceGeneration(recurringInvoice.id, finalNextDate);
        }
      } catch (error) {
        // Log error but continue with other recurring invoices
        console.error(`Error generating invoice from recurring invoice ${recurringInvoice.id}:`, error);
      }
    }

    console.log(`[${new Date().toISOString()}] Recurring invoice generation job completed.`);
  } catch (error) {
    console.error('Error in recurring invoice generation job:', error);
  }
};

/**
 * Initialize and start the recurring invoice cron job
 * Runs daily at midnight (00:00)
 */
export const startRecurringInvoiceJob = () => {
  // Run daily at midnight (00:00)
  // Cron expression: '0 0 * * *' means: minute 0, hour 0, every day, every month, every day of week
  const cronExpression = process.env.RECURRING_INVOICE_CRON || '0 0 * * *';

  console.log(`Scheduling recurring invoice generation job with cron: ${cronExpression}`);

  cron.schedule(cronExpression, async () => {
    await generateRecurringInvoices();
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC',
  });

  console.log('✅ Recurring invoice generation job scheduled successfully');

  // For testing: also run immediately in development mode
  if (process.env.NODE_ENV === 'development' && process.env.RUN_RECURRING_JOB_ON_START === 'true') {
    console.log('Running recurring invoice job immediately (development mode)...');
    generateRecurringInvoices();
  }
};

