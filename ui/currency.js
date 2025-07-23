/**
 * @file A utility for formatting currency values.
 */

/**
 * Formats a number (in cents) into a currency string (e.g., "$123.45").
 * This uses the Intl.NumberFormat API for robust, locale-aware formatting.
 *
 * @param {number} amountInCents - The amount in cents to format.
 * @returns {string} The formatted currency string. Returns an empty string if the input is invalid.
 */
export function formatCurrency(amountInCents) {
  // Ensure the input is a valid number before formatting.
  if (typeof amountInCents !== 'number' || isNaN(amountInCents)) {
    return '$0.00'; // Return a default value for invalid inputs.
  }

  // Convert cents to dollars for formatting.
  const amountInDollars = amountInCents / 100;

  // Use the 'en-US' locale and 'USD' currency for consistency.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInDollars);
}