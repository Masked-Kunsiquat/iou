// features/transactions/add-edit-transaction-modal.js

import { db } from '../../db.js';
import { getState } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

let loadData;
let modalElement;

function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Handles the submission of both the "add" and "edit" transaction forms.
 * @param {Event} e - The submit event.
 */
async function handleFormSubmit(e) {
    // Logic for adding a new transaction
    if (e.target.id === 'transactionForm') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transaction = {
            id: generateUUID(),
            personId: formData.get('personId'),
            type: formData.get('type').toUpperCase(),
            description: formData.get('description'),
            amount: Math.round(parseFloat(formData.get('amount')) * 100),
            date: formData.get('date'),
            dueDate: formData.get('dueDate') || null,
            status: 'pending',
            payments: []
        };
        await db.put('transactions', transaction);
        await loadData();
        closeModal();
    }

    // Logic for editing an existing transaction
    if (e.target.id === 'editTransactionForm') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transactionId = formData.get('transactionId');
        const { transactions } = getState();
        const transaction = transactions.find(t => t.id === transactionId);

        if (transaction) {
            transaction.personId = formData.get('personId');
            transaction.description = formData.get('description');
            transaction.amount = Math.round(parseFloat(formData.get('amount')) * 100);
            transaction.date = formData.get('date');
            transaction.dueDate = formData.get('dueDate') || null;
            await db.put('transactions', transaction);
            await loadData();
            closeModal();
        }
    }
}

/**
 * Initializes the transaction modal listeners.
 * @param {object} dependencies - App dependencies.
 */
export function init(dependencies) {
    loadData = dependencies.loadData;
    modalElement = document.getElementById('app-modal');
    if (modalElement) {
        modalElement.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Shows the modal for adding a new transaction.
 * @param {string} type - The type of transaction ('IOU' or 'UOM').
 */
export function showAddTransactionModal(type) {
    const { persons } = getState();
    const personOptions = persons.map(p => {
        const firstName = escapeHTML(p.firstName || '');
        const lastName = escapeHTML(p.lastName || '');
        return `<option value="${p.id}">${firstName} ${lastName}</option>`;
    }).join('');

    const modalTitle = `Add ${type.toUpperCase()}`;
    const formHtml = `
    <form id="transactionForm" class="space-y-6">
      <input type="hidden" name="type" value="${type}">
      <div>
        <label for="personId" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Person</label>
        <select name="personId" id="personId" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required>
          <option value="">Select person...</option>
          ${personOptions}
        </select>
      </div>
      <div>
        <label for="amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount</label>
        <input type="number" step="0.01" name="amount" id="amount" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="0.00" required>
      </div>
      <div>
        <label for="description" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
        <input type="text" name="description" id="description" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="date" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date</label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>
            </div>
            <input name="date" type="text" id="add-transaction-date" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5" placeholder="Select date" required>
          </div>
        </div>
        <div>
          <label for="dueDate" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Due Date (optional)</label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>
            </div>
            <input name="dueDate" type="text" id="add-transaction-due-date" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5" placeholder="Select date">
          </div>
        </div>
      </div>
      <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Save ${type.toUpperCase()}</button>
    </form>`;

    showModal(modalTitle, formHtml);

    // FIX: Programmatically initialize the new datepickers
    const datepickerEl = document.getElementById('add-transaction-date');
    const datepickerInstance = new Datepicker(datepickerEl, { format: 'yyyy-mm-dd' });
    datepickerInstance.setDate(new Date().toISOString().split('T')[0]); // Set today's date

    const dueDatePickerEl = document.getElementById('add-transaction-due-date');
    new Datepicker(dueDatePickerEl, { format: 'yyyy-mm-dd' });
}

/**
 * Shows the modal for editing an existing transaction.
 * @param {object} transaction - The transaction to edit.
 */
export function showEditTransactionModal(transaction) {
    const { persons } = getState();
    const personOptions = persons.map(p => {
        const firstName = escapeHTML(p.firstName || '');
        const lastName = escapeHTML(p.lastName || '');
        return `<option value="${p.id}" ${p.id === transaction.personId ? 'selected' : ''}>${firstName} ${lastName}</option>`
    }).join('');
    
    const safeDescription = escapeHTML(transaction.description || '');
    const modalTitle = `Edit ${transaction.type}`;
    const formHtml = `
    <form id="editTransactionForm" class="space-y-6">
      <input type="hidden" name="transactionId" value="${transaction.id}">
       <div>
        <label for="edit-personId" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Person</label>
        <select name="personId" id="edit-personId" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>${personOptions}</select>
      </div>
      <div>
        <label for="edit-amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount</label>
        <input type="number" step="0.01" name="amount" id="edit-amount" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" value="${(transaction.amount / 100).toFixed(2)}" required>
      </div>
      <div>
        <label for="edit-description" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
        <input type="text" name="description" id="edit-description" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" value="${safeDescription}" required>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label for="edit-transaction-date" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date</label>
            <div class="relative">
                <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>
                </div>
                <input name="date" id="edit-transaction-date" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5" required>
            </div>
        </div>
        <div>
            <label for="edit-transaction-due-date" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Due Date (optional)</label>
            <div class="relative">
                <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>
                </div>
                <input name="dueDate" id="edit-transaction-due-date" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5">
            </div>
        </div>
      </div>
      <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Update ${transaction.type}</button>
    </form>`;

    showModal(modalTitle, formHtml);

    // FIX: Programmatically initialize the new datepickers
    const datepickerEl = document.getElementById('edit-transaction-date');
    const datepickerInstance = new Datepicker(datepickerEl, { format: 'yyyy-mm-dd' });
    datepickerInstance.setDate(transaction.date);

    if (transaction.dueDate) {
        const dueDatePickerEl = document.getElementById('edit-transaction-due-date');
        const dueDatePickerInstance = new Datepicker(dueDatePickerEl, { format: 'yyyy-mm-dd' });
        dueDatePickerInstance.setDate(transaction.dueDate);
    } else {
        const dueDatePickerEl = document.getElementById('edit-transaction-due-date');
        new Datepicker(dueDatePickerEl, { format: 'yyyy-mm-dd' });
    }
}