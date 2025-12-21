/**
 * Currency utility functions
 * Handles currency validation, conversion, and formatting
 */

/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  MVR: 'Rf',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  CNY: '¥',
  AED: 'د.إ',
  SAR: '﷼',
  THB: '฿',
  MYR: 'RM',
  PHP: '₱',
  IDR: 'Rp',
  HKD: 'HK$',
  NZD: 'NZ$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  RUB: '₽',
  TRY: '₺',
  ZAR: 'R',
  BRL: 'R$',
  MXN: '$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$U',
};

/**
 * Validate currency code (ISO 4217 format)
 * @param {string} code - Currency code to validate
 * @returns {boolean} - True if valid
 */
export const validateCurrencyCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  // ISO 4217: 3 uppercase letters
  return /^[A-Z]{3}$/.test(code);
};

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} - Currency symbol or code if symbol not found
 */
export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode) {
    return '$';
  }
  const code = currencyCode.toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
};

/**
 * Convert amount to base currency using exchange rate
 * @param {number} amount - Amount in document currency
 * @param {number} exchangeRate - Exchange rate (1 document_currency = exchangeRate base_currency)
 * @returns {number} - Amount in base currency
 */
export const convertToBaseCurrency = (amount, exchangeRate) => {
  if (!exchangeRate || exchangeRate <= 0) {
    return amount; // No conversion needed
  }
  return parseFloat((amount * exchangeRate).toFixed(2));
};

/**
 * Convert amount from base currency using exchange rate
 * @param {number} amount - Amount in base currency
 * @param {number} exchangeRate - Exchange rate (1 document_currency = exchangeRate base_currency)
 * @returns {number} - Amount in document currency
 */
export const convertFromBaseCurrency = (amount, exchangeRate) => {
  if (!exchangeRate || exchangeRate <= 0) {
    return amount; // No conversion needed
  }
  return parseFloat((amount / exchangeRate).toFixed(2));
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - ISO 4217 currency code
 * @param {object} options - Formatting options
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode, options = {}) => {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 2,
    locale = 'en-US',
  } = options;

  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = parseFloat(amount || 0).toFixed(decimals);
  const numberWithCommas = parseFloat(formattedAmount).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let result = '';
  if (showSymbol) {
    // Some currencies have symbol before, some after
    const symbolFirst = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'HKD', 'NZD'];
    if (symbolFirst.includes(currencyCode?.toUpperCase())) {
      result = `${symbol}${numberWithCommas}`;
    } else {
      result = `${numberWithCommas} ${symbol}`;
    }
  } else {
    result = numberWithCommas;
  }

  if (showCode && currencyCode) {
    result += ` ${currencyCode.toUpperCase()}`;
  }

  return result;
};

/**
 * Get list of supported currency codes
 * @returns {string[]} - Array of supported currency codes
 */
export const getSupportedCurrencies = () => {
  return Object.keys(CURRENCY_SYMBOLS).sort();
};

