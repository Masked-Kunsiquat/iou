/**
 * @file Provides utility functions for handling contacts, including
 * hashing, ID generation, using the Contact Picker API, and formatting phone numbers.
 */

/**
 * Computes the SHA-256 hash of a given string.
 * This is an async function that returns a hex-encoded hash.
 * @param {string} message - The input string to hash.
 * @returns {Promise<string>} A promise that resolves to the SHA-256 hash as a hex string.
 */
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generates a unique 16-character ID for a person from their name and phone number.
 * It combines the lowercase first name and the last 4 digits of the phone number,
 * then creates a SHA-256 hash and truncates it.
 * @param {string} firstName - The person's first name.
 * @param {string} phoneNumber - The person's phone number.
 * @returns {Promise<string>} A promise that resolves to a 16-character unique ID string.
 */
export async function generatePersonId(firstName, phoneNumber) {
  const last4 = phoneNumber.replace(/\D/g, '').slice(-4);
  const input = `${firstName.toLowerCase().trim()}${last4}`;
  const hash = await sha256(input);
  return hash.substring(0, 16); // Use first 16 chars for brevity
}

/**
 * Opens the Web Contact Picker API to allow the user to select a single contact.
 * @returns {Promise<{firstName: string, lastName: string, phone: string}|null>} 
 * A promise that resolves with an object containing the contact's details,
 * or null if no contact is selected.
 * @throws {Error} Throws an error if the Contact Picker API is not supported or if
 * permission is denied by the user.
 */
export async function pickContact() {
  if (!('contacts' in navigator && 'ContactsManager' in window)) {
    throw new Error('Contact Picker API not supported');
  }

  try {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    const contacts = await navigator.contacts.select(props, opts);
    
    if (contacts.length === 0) return null;
    
    const contact = contacts[0];
    const name = contact.name?.[0] || '';
    const tel = contact.tel?.[0] || '';
    
    // Parse name (simple split)
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      firstName,
      lastName,
      phone: tel
    };
  } catch (err) {
    if (err.name === 'SecurityError') {
      throw new Error('Permission denied');
    }
    throw err;
  }
}

/**
 * Formats a phone number string into a standard (XXX) XXX-XXXX format.
 * Only formats strings that contain exactly 10 digits.
 * @param {string} phone - The raw phone number string.
 * @returns {string} The formatted phone number, or the original string if it's not 10 digits.
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Extracts the last 4 digits from a phone number string.
 * @param {string} phone - The raw phone number string.
 * @returns {string} The last 4 digits of the phone number.
 */
export function getLast4(phone) {
  return phone.replace(/\D/g, '').slice(-4);
}