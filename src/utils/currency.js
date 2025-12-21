/**
 * Frontend currency utility functions
 * Handles currency symbol mapping and formatting
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
  } = options;

  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = parseFloat(amount || 0).toFixed(decimals);
  const numberWithCommas = parseFloat(formattedAmount).toLocaleString('en-US', {
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
 * Get list of supported currency codes with their symbols
 * @returns {Array} - Array of { code, symbol, name } objects
 */
export const getSupportedCurrencies = () => {
  const currencies = [
    { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  ];

  return currencies;
};

/**
 * Get currency name by code
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} - Currency name or code if not found
 */
export const getCurrencyName = (currencyCode) => {
  const currencies = getSupportedCurrencies();
  const currency = currencies.find(c => c.code === currencyCode?.toUpperCase());
  return currency?.name || currencyCode || 'Unknown';
};

