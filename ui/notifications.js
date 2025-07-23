/**
 * @file Handles user notifications like confirmations and alerts.
 */

/**
 * Shows a message to the user.
 * @param {string} message - The message to display.
 */
export function showAlert(message) {
  alert(message);
}

/**
 * Asks the user for confirmation.
 * @param {string} message - The confirmation question to ask.
 * @returns {boolean} - True if the user confirmed, false otherwise.
 */
export function showConfirm(message) {
  return confirm(message);
}