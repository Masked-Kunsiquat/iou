// features/persons/person-renderer.js

import { app } from '../../core/state.js';
import { formatPhone } from './contact-helper.js';
import { deletePerson } from '../actions.js';
import { editPerson } from './person-modals.js';

/**
 * Renders the list of all persons.
 */
export function renderPersons() {
    const main = document.getElementById('main');
    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">People</h2>
    <div class="list">
      ${app.persons.length === 0 ? '<p class="text-gray">No people added yet</p>' : ''}
      ${app.persons.map(p => `
        <div class="list-item">
          <div class="flex-between">
            <div>
              <div class="font-bold">${p.firstName} ${p.lastName}</div>
              <div class="text-sm text-gray">${formatPhone(p.phone)}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn-icon" data-action="edit-person" data-id="${p.id}">✏️</button>
              <button class="btn-icon text-red" data-action="delete-person" data-id="${p.id}">×</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
    
    main.querySelectorAll('[data-action="edit-person"]').forEach(btn => btn.addEventListener('click', () => editPerson(btn.dataset.id)));
    main.querySelectorAll('[data-action="delete-person"]').forEach(btn => btn.addEventListener('click', () => deletePerson(btn.dataset.id)));
}