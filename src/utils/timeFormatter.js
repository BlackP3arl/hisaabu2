/**
 * Time formatting utility functions
 * Formats timestamps into human-readable relative time strings
 */

/**
 * Format timestamp to relative time string
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} - Formatted relative time string (e.g., "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp instanceof Date 
    ? timestamp 
    : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Format as date for older items
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Format timestamp to absolute date/time string
 * @param {Date|string|number} timestamp - Timestamp to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date/time string
 */
export const formatAbsoluteTime = (timestamp, options = {}) => {
  if (!timestamp) return '';

  const date = timestamp instanceof Date 
    ? timestamp 
    : new Date(timestamp);

  const {
    includeTime = false,
    includeYear = true,
  } = options;

  if (includeTime) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: includeYear ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
  });
};

