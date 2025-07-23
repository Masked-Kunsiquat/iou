// features/persons/person-renderer.js

import { getState } from '../../core/state.js';
import { formatPhone } from './contact-helper.js';
import { deletePerson } from '../actions.js';
import { editPerson } from './person-modals.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

/**
 * Renders the list of all persons with added data validation.
 */
export function renderPersons() {
    const main = document.getElementById('main');
    const { persons } = getState();

    if (!main) {
        console.error('Fatal Error: The "main" element was not found in the DOM.');
        return;
    }

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">People</h2>
    <div class="list">
      ${persons.length === 0 ? '<p class="text-gray">No people added yet</p>' : ''}
      ${persons
        .filter(p => p && p.id && p.firstName) // Ensure the person object and required fields exist
        .map(p => {
        // Sanitize data and provide fallbacks for optional fields
        const firstName = escapeHTML(p.firstName); // Already ensured it exists by the filter
        const lastName = escapeHTML(p.lastName || ''); // Fallback for optional last name
        const phone = escapeHTML(formatPhone(p.phone || '')); // Fallback for optional phone

        return `
        <div class="list-item">
          <div class="flex-between">
            <div>
              <div class="font-bold">${firstName} ${lastName}</div>
              <div class="text-sm text-gray">${phone}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn-icon" data-action="edit-person" data-id="${p.id}">✏️</button>
              <button class="btn-icon text-red" data-action="delete-person" data-id="${p.id}">×</button>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;
    
    main.querySelectorAll('[data-action="edit-person"]').forEach(btn => btn.addEventListener('click', () => editPerson(btn.dataset.id)));
    main.querySelectorAll('[data-action="delete-person"]').forEach(btn => btn.addEventListener('click', () => deletePerson(btn.dataset.id)));
}