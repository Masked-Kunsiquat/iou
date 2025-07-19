// Contact picker and SHA-256 utilities

// SHA-256 implementation for browser
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate person ID from name and phone
export async function generatePersonId(firstName, phoneNumber) {
  const last4 = phoneNumber.replace(/\D/g, '').slice(-4);
  const input = `${firstName.toLowerCase().trim()}${last4}`;
  const hash = await sha256(input);
  return hash.substring(0, 16); // Use first 16 chars for brevity
}

// Pick contact using Web Contact Picker API
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

// Format phone number for display
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Get last 4 digits of phone
export function getLast4(phone) {
  return phone.replace(/\D/g, '').slice(-4);
}