/**
 * @file Helper functions for the Contact Picker API.
 */

/**
 * Checks if the Contact Picker API is supported by the browser.
 * @returns {boolean} True if supported, false otherwise.
 */
export function isContactPickerSupported() {
  return 'contacts' in navigator && 'ContactsManager' in window;
}

/**
 * Opens the Contact Picker UI and returns the selected contact's information.
 * @returns {Promise<{name: string, phone: string}|null>} An object with the contact's name and phone, or null if cancelled.
 */
export async function pickContact() {
  if (!isContactPickerSupported()) {
    alert('Contact Picker API is not supported on this browser.');
    return null;
  }

  try {
    const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
    if (contacts.length > 0) {
      const contact = contacts[0];
      return {
        name: contact.name[0],
        phone: contact.tel[0],
      };
    }
    return null;
  } catch (error) {
    console.error('Error picking contact:', error);
    return null;
  }
}