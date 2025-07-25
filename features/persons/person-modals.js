// features/persons/person-modals.js

import { db } from '../../db.js';
import { generatePersonId, pickContact } from './contact-helper.js';
import { getState } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { showAlert } from '../../ui/notifications.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

let loadData;
let modalElement; // We'll keep a reference to the modal element

/**
 * Attaches a single, persistent event listener to the modal to handle form submissions.
 * This uses event delegation, which is more reliable for dynamic content.
 * @param {Event} e - The event object.
 */
async function handleFormSubmit(e) {
    // Check if the submitted element is the person form
    if (e.target.id === 'personForm') {
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
    }
    
    // Check if the submitted element is the edit person form
    if (e.target.id === 'editPersonForm') {
        e.preventDefault();
        // The rest of the edit logic will go here later
    }
}

/**
 * Handles clicks on the "Pick Contact" button.
 */
async function handlePickContact(e) {
    if (e.target.id === 'pickContactBtn') {
        try {
            const contact = await pickContact();
            if (contact) {
                // Since this runs inside the modal, we can be sure these elements exist
                document.querySelector('[name="firstName"]').value = contact.firstName;
                document.querySelector('[name="lastName"]').value = contact.lastName;
                document.querySelector('[name="phone"]').value = contact.phone;
            }
        } catch (err) {
            showAlert('Could not pick contact: ' + err.message);
        }
    }
}


/**
 * Initializes the person modals by setting up dependencies and event listeners.
 * @param {object} dependencies - The functions to inject.
 */
export function initPersonModals(dependencies) {
    loadData = dependencies.loadData;
    modalElement = document.getElementById('app-modal');

    // Attach delegated listeners to the modal that will catch events from its children
    if (modalElement) {
        modalElement.addEventListener('submit', handleFormSubmit);
        modalElement.addEventListener('click', handlePickContact);
    }
}

/**
 * Shows the modal for adding a new person by injecting its HTML.
 */
export function showPersonModal() {
    showModal('Add Person', `
    <form id="personForm" class="space-y-6">
        <div>
            <label for="firstName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
            <input type="text" name="firstName" id="firstName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" required>
        </div>
        <div>
            <label for="lastName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
            <input type="text" name="lastName" id="lastName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white">
        </div>
        <div>
            <label for="phone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone Number</label>
            <input type="tel" name="phone" id="phone" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" required>
        </div>
        <div class="flex flex-col sm:flex-row gap-4">
            <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save Person</button>
            <button type="button" id="pickContactBtn" class="w-full text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">🕵️ Pick Contact</button>
        </div>
    </form>
  `);
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
    <form id="editPersonForm" class="space-y-6">
      <div>
        <label for="editFirstName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
        <input type="text" name="firstName" id="editFirstName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" value="${safeFirstName}" required>
      </div>
      <div>
        <label for="editLastName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
        <input type="text" name="lastName" id="editLastName" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" value="${safeLastName || ''}">
      </div>
      <div>
        <label for="editPhone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone Number</label>
        <input type="tel" name="phone" id="editPhone" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" value="${safePhone}" required>
      </div>
      <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Update Person</button>
    </form>
  `);
    // NOTE: The submit logic for this edit form will be added to the `handleFormSubmit` function.
    // We will tackle that after confirming the "Add Person" form works.
}