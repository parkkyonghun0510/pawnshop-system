/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string | undefined | null,
  currency = 'USD',
  locale = 'en-US'
): string => {
  if (value === undefined || value === null) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format a date string
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormatOptions
 * @param locale - The locale (default: en-US)
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale = 'en-US'
): string => {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Format a date and time string
 * @param dateString - The date string to format
 * @param locale - The locale (default: en-US)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateString: string | Date | undefined | null,
  locale = 'en-US'
): string => {
  return formatDate(
    dateString,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale
  );
};

/**
 * Format a number with commas
 * @param value - The number to format
 * @param locale - The locale (default: en-US)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string | undefined | null,
  locale = 'en-US'
): string => {
  if (value === undefined || value === null) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale).format(numValue);
};

/**
 * Format a percentage
 * @param value - The number to format as percentage
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale (default: en-US)
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number | string | undefined | null,
  decimals = 2,
  locale = 'en-US'
): string => {
  if (value === undefined || value === null) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

/**
 * Format a phone number
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string | undefined | null): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Return original if can't format
  return phoneNumber;
};

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string | undefined | null, maxLength: number): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Convert camelCase to Title Case
 * @param camelCase - The camelCase string
 * @returns Title Case string
 */
export const camelToTitleCase = (camelCase: string): string => {
  if (!camelCase) return '';
  
  const result = camelCase.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};
