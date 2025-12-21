/**
 * Calculation utilities for line items and documents
 */

/**
 * Calculate line item total
 * Formula: (quantity × price × (1 - discountPercent/100)) × (1 + taxPercent/100)
 */
export const calculateLineTotal = (quantity, price, discountPercent = 0, taxPercent = 0) => {
  const subtotal = quantity * price;
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const lineTotal = afterDiscount + taxAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    afterDiscount: parseFloat(afterDiscount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    lineTotal: parseFloat(lineTotal.toFixed(2)),
  };
};

/**
 * Calculate document totals from line items
 */
export const calculateDocumentTotals = (lineItems) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  lineItems.forEach(item => {
    const itemSubtotal = item.quantity * item.price;
    const itemDiscount = itemSubtotal * (item.discountPercent / 100);
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    const itemTax = itemAfterDiscount * (item.taxPercent / 100);

    subtotal += itemSubtotal;
    discountTotal += itemDiscount;
    taxTotal += itemTax;
  });

  const totalAmount = subtotal - discountTotal + taxTotal;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    taxTotal: parseFloat(taxTotal.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};


