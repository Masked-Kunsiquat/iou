// features/persons/person-modals.js

import { db } from '../../db.js';
import { generatePersonId, pickContact } from './contact-helper.js';
import { app } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { showAlert } from '../../ui/notifications.js';
import { escapeHTML } from '../../ui/html-sanitizer.js'; // Import the sanitizer

let loadData;
let render;

export function initPersonModals(dependencies) {
    loadData = dependencies.loadData;
    render = dependencies.render;
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
        render();
    });
}

/**
 * Updates a person's details in the database.
 * @param {string} personId - The ID of the person to edit.
 */
export function editPerson(personId) {
    const person = app.persons.find(p => p.id === personId);
    if (!person) return;

    // Sanitize the data before inserting it into the HTML
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

        person.firstName = formData.get('firstName');
        person.lastName = formData.get('lastName');
        person.phone = formData.get('phone');

        const newId = await generatePersonId(person.firstName, person.phone);

        if (newId !== person.id) {
            app.transactions.forEach(t => {
                if (t.personId === person.id) t.personId = newId;
            });
            await db.delete('persons', person.id);
            for (const t of app.transactions.filter(t => t.personId === newId)) {
                await db.put('transactions', t);
            }
            person.id = newId;
        }

        await db.put('persons', person);
        await loadData();
        closeModal();
        render();
    });
};