/**
 * @file Utility functions for person-related operations and validation.
 */

/**
 * Normalizes a phone number by stripping non-numeric characters and the leading '1' for US country codes.
 * @param {string | null | undefined} phone - The phone number to normalize.
 * @returns {string} The normalized 10-digit phone number.
 */
export function normalizePhoneNumber(phone) {
	if (!phone) return '';
	let normalized = phone.replace(/\D/g, '');
	if (normalized.length === 11 && normalized.startsWith('1')) {
		normalized = normalized.substring(1);
	}
	return normalized;
}

/**
 * Validates a person's data before saving.
 * @param {{ name: string; phone: string; }} personData - The data for the person.
 * @param {any[]} existingPersons - An array of existing persons to check for uniqueness.
 * @param {string | null} currentId - The ID of the person being edited, if any.
 * @returns {{isValid: boolean, error: string|null}} - The result of the validation.
 */
export function validatePerson(personData, existingPersons, currentId = null) {
	const normalizedPhone = normalizePhoneNumber(personData.phone);

	// Rule 1: If a phone number is provided, it must be 10 digits.
	if (personData.phone && normalizedPhone.length !== 10) {
		return {
			isValid: false,
			error: 'Phone number must be 10 digits.'
		};
	}

	// Rule 2: The combination of name and phone number must be unique.
	const isDuplicate = existingPersons.some((p) => {
		// If we are editing, skip the check against the person themselves
		if (p.id === currentId) {
			return false;
		}
		return (
			p.name.trim().toLowerCase() === personData.name.trim().toLowerCase() &&
			normalizePhoneNumber(p.phone) === normalizedPhone
		);
	});

	if (isDuplicate) {
		return {
			isValid: false,
			error: 'A person with the same name and phone number already exists.'
		};
	}

	return { isValid: true, error: null };
}