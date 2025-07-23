// features/persons/person-modals.js

import { db } from '../../db.js';
import { generatePersonId, pickContact } from './contact-helper.js';
import { getState } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { showAlert } from '../../ui/notifications.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

let loadData;

export function initPersonModals(dependencies) {
    loadData = dependencies.loadData;
}

/**
 * Shows the modal for adding a new person.
 */
export function showPersonModal() {
    showModal('Add Person', `
    <form id="personForm">
      <div class="form-group"><label class="label">First Name</label><input type="text" name="firstName" class="input" required></div>
      <div class="form-group"><label class="label">Last Name</label><input type="text" name="lastName" class="input"></div>
      <div class="form-group"><label class="label">Phone Number</label><input type="tel" name="phone" class="input" required></div>
      <div class="flex gap-2">
        <button type="submit" class="btn flex-1">Save</button>
        <button type="button" id="pickContactBtn" class="btn btn-secondary flex-1">🕵️ Pick Contact</button>
      </div>
    </form>
  `);

    document.getElementById('pickContactBtn').addEventListener('click', async () => {
        try {
            const contact = await pickContact();
            if (contact) {
                document.querySelector('[name="firstName"]').value = contact.firstName;
                document.querySelector('[name="lastName"]').value = contact.lastName;
                document.querySelector('[name="phone"]').value = contact.phone;
            }
        } catch (err) {
            showAlert('Could not pick contact: ' + err.message);
        }
    });

    document.getElementById('personForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const person = {
            id: await generatePersonId(formData.get('firstName'), formData.get('phone')),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone')
        };
        await db.put('persons', person);
        await loadData();
        closeModal();
    });
}

/**
 * Updates a person's details in the database.
 * @param {string} personId - The ID of the person to edit.
 */
export function editPerson(personId) {
    const { persons, transactions } = getState();
    const person = persons.find(p => p.id === personId);
    if (!person) return;

    const safeFirstName = escapeHTML(person.firstName);
    const safeLastName = escapeHTML(person.lastName);
    const safePhone = escapeHTML(person.phone);

    showModal('Edit Person', `
    <form id="editPersonForm">
      <div class="form-group"><label class="label">First Name</label><input type="text" name="firstName" class="input" value="${safeFirstName}" required></div>
      <div class="form-group"><label class="label">Last Name</label><input type="text" name="lastName" class="input" value="${safeLastName || ''}"></div>
      <div class="form-group"><label class="label">Phone Number</label><input type="tel" name="phone" class="input" value="${safePhone}" required></div>
      <button type="submit" class="btn w-full">Update</button>
    </form>
  `);

    document.getElementById('editPersonForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const originalId = person.id;

        // Create a temporary updated person object to check for ID change
        const updatedPersonData = {
            ...person,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
        };

        const newId = await generatePersonId(updatedPersonData.firstName, updatedPersonData.phone);

        if (newId !== originalId) {
            // ID has changed, so perform an atomic transaction
            updatedPersonData.id = newId;

            const operations = [
                // 1. Delete the old person record
                { type: 'delete', storeName: 'persons', key: originalId },
                // 2. Add the new person record
                { type: 'put', storeName: 'persons', value: updatedPersonData }
            ];

            // 3. Find and add all related transactions to be updated
            transactions.forEach(t => {
                if (t.personId === originalId) {
                    const updatedTransaction = { ...t, personId: newId };
                    operations.push({ type: 'put', storeName: 'transactions', value: updatedTransaction });
                }
            });

            try {
                await db.transact(operations);
            } catch (error) {
                showAlert('An error occurred while updating the person and their transactions. The operation was cancelled to preserve data integrity.');
                console.error('Atomic transaction failed:', error);
                return; // Stop execution to prevent inconsistent state
            }
        } else {
            // ID did not change, so just a simple update is needed
            await db.put('persons', updatedPersonData);
        }

        await loadData();
        closeModal();
    });
};