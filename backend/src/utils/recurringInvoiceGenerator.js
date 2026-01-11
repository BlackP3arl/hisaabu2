/**
 * Utility functions for recurring invoice generation
 */

/**
 * Calculate next generation date based on frequency and last date
 * @param {string} frequency - daily, weekly, monthly, quarterly, annually
 * @param {Date} lastDate - Last generation date or start date
 * @returns {Date} Next generation date
 */
export const calculateNextGenerationDate = (frequency, lastDate) => {
  const nextDate = new Date(lastDate);
  nextDate.setHours(0, 0, 0, 0);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Handle month end edge cases (e.g., Jan 31 -> Feb 28/29)
      if (nextDate.getDate() !== lastDate.getDate()) {
        // If day changed, we went past month end, set to last day of month
        nextDate.setDate(0); // Go to last day of previous month
      }
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      // Handle month end edge cases
      if (nextDate.getDate() !== lastDate.getDate()) {
        nextDate.setDate(0);
      }
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      // Handle leap year edge cases (e.g., Feb 29 -> Feb 28 in non-leap year)
      if (nextDate.getDate() !== lastDate.getDate()) {
        nextDate.setDate(0);
      }
      break;
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return nextDate;
};

/**
 * Calculate due date based on issue date and payment terms
 * @param {Date} issueDate - Invoice issue date
 * @param {number} dueDateDays - Number of days for payment terms (1-30)
 * @returns {Date} Due date
 */
export const calculateDueDate = (issueDate, dueDateDays) => {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueDateDays);
  return dueDate;
};

/**
 * Generate schedule of future invoice dates
 * @param {Object} recurringInvoice - Recurring invoice object
 * @param {number} count - Number of future dates to generate (default: 12)
 * @returns {Array<Object>} Array of {issueDate, dueDate} objects
 */
export const generateSchedule = (recurringInvoice, count = 12) => {
  const schedule = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Determine starting date
  let currentDate;
  if (recurringInvoice.next_generation_date) {
    currentDate = new Date(recurringInvoice.next_generation_date);
  } else {
    currentDate = new Date(recurringInvoice.start_date);
  }
  currentDate.setHours(0, 0, 0, 0);

  const endDate = new Date(recurringInvoice.end_date);
  endDate.setHours(0, 0, 0, 0);

  // Generate dates until we reach end_date or count limit
  for (let i = 0; i < count && currentDate <= endDate; i++) {
    if (currentDate >= today) {
      const issueDate = new Date(currentDate);
      const dueDate = calculateDueDate(issueDate, recurringInvoice.due_date_days);
      
      schedule.push({
        issueDate: issueDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }

    // Calculate next date
    currentDate = calculateNextGenerationDate(recurringInvoice.frequency, currentDate);
  }

  return schedule;
};

/**
 * Prepare invoice data from recurring invoice template
 * @param {Object} recurringInvoice - Recurring invoice object with items
 * @param {Date} issueDate - Issue date for the invoice
 * @returns {Object} Invoice data ready for creation
 */
export const prepareInvoiceData = (recurringInvoice, issueDate) => {
  const dueDate = calculateDueDate(issueDate, recurringInvoice.due_date_days);

  // Determine status based on auto_bill setting
  let status = 'draft';
  if (recurringInvoice.auto_bill === 'enabled') {
    status = 'sent';
  } else if (recurringInvoice.auto_bill === 'opt_in') {
    status = 'draft';
  }
  // If disabled, invoice won't be generated (handled by cron job)

  // Prepare line items
  const items = recurringInvoice.items.map(item => ({
    itemId: item.item_id,
    name: item.name,
    description: item.description || '',
    quantity: parseFloat(item.quantity) || 1,
    price: parseFloat(item.price) || 0,
    discountPercent: parseFloat(item.discount_percent || 0),
    taxPercent: parseFloat(item.tax_percent || 0),
  }));

  return {
    clientId: recurringInvoice.client_id,
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    status,
    items,
    notes: recurringInvoice.notes || '',
    terms: recurringInvoice.terms || '',
    currency: recurringInvoice.currency || null,
    exchangeRate: recurringInvoice.exchange_rate || null,
  };
};

