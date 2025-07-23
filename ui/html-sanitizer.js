/**
 * @file Provides functions for sanitizing HTML to prevent XSS.
 */

/**
 * Escapes special HTML characters in a string to prevent XSS attacks.
 * @param {string} str - The raw string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) {
    return '';
  }
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}