// core/main.js

import { db } from '../db.js';
import { generatePersonId, pickContact } from '../contact-helper.js';
import { app } from './state.js';

// Import UI Modules
import { initModal, showModal, closeModal } from '../ui/modal.js';
import { initFab } from '../ui/fab.js';
import { initNavigation } from '../ui/navigation.js';
import { showAlert, showConfirm } from '../ui/notifications.js';
import { initRenderer, render } from '../ui/renderer.js';


// =================================================================================================
// INITIALIZATION
// =================================================================================================

/**
 * Initializes the application, loads data, and sets up UI modules.
 */
export async function init() {
    await db.init();
    await loadData();

    // Pass dependencies to the new renderer module
    initRenderer({
        calculateBalance,
        handleTransactionAction,
        editPerson,
        deletePerson,
    });

    // Initialize UI modules, passing the app object for context
    initModal({ render });
    initFab({ ...app, showPersonModal, showTransactionModal }); // Pass app state and modal functions
    initNavigation({ render });

    setupEventListeners();
    registerServiceWorker();

    document.getElementById('versionBadge').textContent = `v${app.version}`;
    render(); // Initial render
}

/**
 * Loads all persons and transactions from the database into the app state.
 */
async function loadData() {
    app.persons = await db.getAll('persons');
    app.transactions = await db.getAll('transactions');
}

/**
 * Sets up event listeners that are not handled by the individual UI modules.
 */
function setupEventListeners() {
    // Import/Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('change', handleImport);

    // Add a global listener for hash changes to re-render
    window.addEventListener('hashchange', () => {
        app.currentView = window.location.hash.slice(1) || 'iou';
        render();
    });
}

// =================================================================================================
// DATA MANIPULATION & ACTIONS
// =================================================================================================

/**
 * Calculates the remaining balance for a transaction.
 * @param {object} transaction - The transaction object.
 * @returns {number} The remaining balance in cents.
 */
function calculateBalance(transaction) {
    const totalPaid = transaction.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return transaction.amount - totalPaid;
}

/**
 * Handles clicks on action buttons within a transaction card.
 * @param {Event} e - The click event.
 */
function handleTransactionAction(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    const transaction = app.transactions.find(t => t.id === id);

    switch (action) {
        case 'payment':
            showPaymentModal(transaction);
            break;
        case 'details':
            showTransactionDetails(transaction);
            break;
        case 'edit':
            showEditTransactionModal(transaction);
            break;
        case 'delete':
            deleteTransaction(transaction);
            break;
    }
}

/**
 * Deletes a transaction after confirmation.
 * @param {object} transaction - The transaction to delete.
 */
async function deleteTransaction(transaction) {
    if (!showConfirm(`Delete this ${transaction.type}? This action cannot be undone.`)) return;
    await db.delete('transactions', transaction.id);
    await loadData();
    render();
}

/**
 * Deletes a specific payment from a transaction.
 * @param {string} transactionId - The ID of the parent transaction.
 * @param {string} paymentId - The ID of the payment to delete.
 */
window.deletePayment = async function (transactionId, paymentId) {
    if (!showConfirm('Delete this payment?')) return;

    const transaction = app.transactions.find(t => t.id === transactionId);
    transaction.payments = transaction.payments.filter(p => p.id !== paymentId);

    if (calculateBalance(transaction) > 0) {
        transaction.status = 'pending';
    }

    await db.put('transactions', transaction);
    await loadData();
    closeModal();
    render();
};

/**
 * Deletes a person after confirming they have no associated transactions.
 * @param {string} personId - The ID of the person to delete.
 */
async function deletePerson(personId) {
    const hasTransactions = app.transactions.some(t => t.personId === personId);

    if (hasTransactions) {
        showAlert('Cannot delete person with existing transactions. Please delete their transactions first.');
        return;
    }

    if (!showConfirm('Are you sure you want to delete this person?')) return;

    await db.delete('persons', personId);
    await loadData();
    render();
};

/**
 * Updates a person's details in the database.
 * @param {string} personId - The ID of the person to edit.
 */
function editPerson(personId) {
    const person = app.persons.find(p => p.id === personId);

    showModal('Edit Person', `
    <form id="editPersonForm">
      <div class="form-group"><label class="label">First Name</label><input type="text" name="firstName" class="input" value="${person.firstName}" required></div>
      <div class="form-group"><label class="label">Last Name</label><input type="text" name="lastName" class="input" value="${person.lastName || ''}"></div>
      <div class="form-group"><label class="label">Phone Number</label><input type="tel" name="phone" class="input" value="${person.phone}" required></div>
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


// =================================================================================================
// MODAL DIALOGS
// =================================================================================================

/**
 * Shows the modal for adding a new person.
 */
function showPersonModal() {
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
 * Shows the modal for adding a new transaction.
 * @param {string} type - The type of transaction ('IOU' or 'UOM').
 */
function showTransactionModal(type) {
    const personOptions = app.persons.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('');
    showModal(`Add ${type}`, `
    <form id="transactionForm">
      <div class="form-group"><label class="label">Person</label><select name="personId" class="select" required><option value="">Select person...</option>${personOptions}</select></div>
      <div class="form-group"><label class="label">Amount</label><input type="number" step="0.01" name="amount" class="input" placeholder="0.00" required></div>
      <div class="form-group"><label class="label">Description</label><input type="text" name="description" class="input" required></div>
      <div class="form-group"><label class="label">Date</label><input type="date" name="date" class="input" required value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="label">Due Date (optional)</label><input type="date" name="dueDate" class="input"></div>
      <button type="submit" class="btn w-full">Save ${type}</button>
    </form>
  `);

    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transaction = {
            id: Date.now().toString(),
            personId: formData.get('personId'),
            type: type.toUpperCase(),
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
        render();
    });
}

/**
 * Shows the modal for adding a payment to a transaction.
 * @param {object} transaction - The transaction to add a payment to.
 */
function showPaymentModal(transaction) {
    const person = app.persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);

    showModal('Record Payment', `
    <form id="paymentForm">
      <div class="mb-2"><strong>${person?.firstName} ${person?.lastName}</strong><br><span class="text-sm text-gray">Balance: ${(balance / 100).toFixed(2)}</span></div>
      <div class="form-group"><label class="label">Amount</label><input type="number" step="0.01" name="amount" class="input" placeholder="0.00" required max="${balance / 100}"></div>
      <div class="form-group"><label class="label">Payment Date</label><input type="date" name="paymentDate" class="input" required value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="label">Note (optional)</label><input type="text" name="note" class="input" placeholder="Payment note"></div>
      <button type="submit" class="btn w-full">Record Payment</button>
    </form>
  `);

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payment = {
            id: Date.now().toString(),
            transactionId: transaction.id,
            amount: Math.round(parseFloat(formData.get('amount')) * 100),
            date: formData.get('paymentDate') + 'T12:00:00.000Z',
            note: formData.get('note')
        };
        transaction.payments = transaction.payments || [];
        transaction.payments.push(payment);
        if (calculateBalance(transaction) === 0) transaction.status = 'paid';
        await db.put('transactions', transaction);
        await loadData();
        closeModal();
        render();
    });
}

/**
 * Shows the modal with detailed information about a transaction.
 * @param {object} transaction - The transaction to show details for.
 */
function showTransactionDetails(transaction) {
    const person = app.persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);
    const paymentsHtml = transaction.payments?.map(p => `
    <div class="list-item"><div class="flex-between">
        <div>
          <div class="text-sm">${(p.amount / 100).toFixed(2)}</div>
          <div class="text-xs text-gray">${new Date(p.date).toLocaleDateString()}</div>
          ${p.note ? `<div class="text-xs text-gray">${p.note}</div>` : ''}
        </div>
        <button class="btn-icon text-red" onclick="deletePayment('${transaction.id}', '${p.id}')">×</button>
    </div></div>`
    ).join('') || '<p class="text-sm text-gray">No payments yet</p>';

    showModal('Transaction Details', `
    <div class="mb-4"><strong>${person?.firstName} ${person?.lastName}</strong><br><span class="text-sm text-gray">${transaction.description}</span></div>
    <div class="mb-4">
      <div class="flex-between mb-2"><span>Original Amount:</span><span>${(transaction.amount / 100).toFixed(2)}</span></div>
      <div class="flex-between mb-2"><span>Current Balance:</span><span class="font-bold">${(balance / 100).toFixed(2)}</span></div>
      <div class="flex-between"><span>Status:</span><span class="${transaction.status === 'paid' ? 'text-green' : ''}">${transaction.status}</span></div>
    </div>
    <h3 class="font-bold mb-2">Payment History</h3><div class="list">${paymentsHtml}</div>
  `);
}

/**
 * Shows the modal for editing an existing transaction.
 * @param {object} transaction - The transaction to edit.
 */
function showEditTransactionModal(transaction) {
    const personOptions = app.persons.map(p => `<option value="${p.id}" ${p.id === transaction.personId ? 'selected' : ''}>${p.firstName} ${p.lastName}</option>`).join('');
    showModal(`Edit ${transaction.type}`, `
    <form id="editTransactionForm">
      <div class="form-group"><label class="label">Person</label><select name="personId" class="select" required>${personOptions}</select></div>
      <div class="form-group"><label class="label">Amount</label><input type="number" step="0.01" name="amount" class="input" value="${(transaction.amount / 100).toFixed(2)}" required></div>
      <div class="form-group"><label class="label">Description</label><input type="text" name="description" class="input" value="${transaction.description}" required></div>
      <div class="form-group"><label class="label">Date</label><input type="date" name="date" class="input" value="${transaction.date}" required></div>
      <div class="form-group"><label class="label">Due Date (optional)</label><input type="date" name="dueDate" class="input" value="${transaction.dueDate || ''}"></div>
      <button type="submit" class="btn w-full">Update ${transaction.type}</button>
    </form>
  `);

    document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        transaction.personId = formData.get('personId');
        transaction.description = formData.get('description');
        transaction.amount = Math.round(parseFloat(formData.get('amount')) * 100);
        transaction.date = formData.get('date');
        transaction.dueDate = formData.get('dueDate') || null;
        await db.put('transactions', transaction);
        await loadData();
        closeModal();
        render();
    });
}

// =================================================================================================
// UTILITIES & SERVICE WORKER
// =================================================================================================

/**
 * Exports all app data to a JSON file.
 */
async function exportData() {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        persons: app.persons,
        transactions: app.transactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iou-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Imports data from a JSON file, either merging or replacing existing data.
 * @param {Event} e - The file input change event.
 */
async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            const shouldMerge = showConfirm('Merge with existing data? (Cancel to replace all data)');

            if (!shouldMerge) {
                await db.clear('persons');
                await db.clear('transactions');
            }

            for (const person of data.persons) await db.put('persons', person);
            for (const transaction of data.transactions) await db.put('transactions', transaction);

            await loadData();
            render();
            showAlert('Data imported successfully!');
        } catch (err) {
            showAlert('Error importing data: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

/**
 * Registers the service worker and handles update notifications.
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('Service Worker registered');

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                        if (showConfirm('New version available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    }
}