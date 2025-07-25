// features/transactions/transaction-modals.js

import { db } from '../../db.js';
import { getState, setState } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { deletePayment } from '../actions.js';
import { calculateBalance } from './transaction-utils.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';
import { formatCurrency } from '../../ui/currency.js';
import { generateIOUs } from './split-utils.js';
import { TRANSACTION_TYPES } from '../../core/constants.js';
import { showPersonModal } from '../persons/person-modals.js';

let loadData;

function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function initTransactionModals(dependencies) {
    loadData = dependencies.loadData;
}

/**
 * Shows the modal for adding a new transaction.
 * @param {string} type - The type of transaction ('IOU' or 'UOM').
 */
export function showTransactionModal(type) {
    const { persons } = getState();
    const personOptions = persons.map(p => {
        const firstName = escapeHTML(p.firstName || '');
        const lastName = escapeHTML(p.lastName || '');
        return `<option value="${p.id}">${firstName} ${lastName}</option>`;
    }).join('');

    const modalTitle = `Add ${type.toUpperCase()}`; // Uppercase the type for the title

    showModal(modalTitle, `
    <form id="transactionForm">
      <div class="form-group"><label class="label">Person</label><select name="personId" class="select" required><option value="">Select person...</option>${personOptions}</select></div>
      <div class="form-group"><label class="label">Amount</label><input type="number" step="0.01" name="amount" class="input" placeholder="0.00" required></div>
      <div class="form-group"><label class="label">Description</label><input type="text" name="description" class="input" required></div>
      <div class="form-group"><label class="label">Date</label><input type="date" name="date" class="input" required value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="label">Due Date (optional)</label><input type="date" name="dueDate" class="input"></div>
      <button type="submit" class="btn w-full">Save ${type.toUpperCase()}</button>
    </form>
  `);

    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const transaction = {
            id: generateUUID(),
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
    });
}

/**
 * Shows the modal for adding a payment to a transaction.
 * @param {object} transaction - The transaction to add a payment to.
 */
export function showPaymentModal(transaction) {
    const { persons } = getState();
    const person = persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);

    const safePersonName = person ? escapeHTML(`${person.firstName} ${person.lastName}`) : 'Unknown Person';

    showModal('Record Payment', `
    <form id="paymentForm">
      <div class="mb-2"><strong>${safePersonName}</strong><br><span class="text-sm text-gray">Balance: ${formatCurrency(balance)}</span></div>
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
            id: generateUUID(),
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
    });
}

/**
 * Shows the modal with detailed information about a transaction.
 * @param {object} transaction - The transaction to show details for.
 */
export function showTransactionDetails(transaction) {
    const { persons } = getState();
    const person = persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);
    
    const safePersonName = person ? escapeHTML(`${person.firstName} ${person.lastName}`) : 'Unknown Person';
    const safeDescription = escapeHTML(transaction.description || '');

    const paymentsHtml = transaction.payments?.map(p => {
        const safeNote = p.note ? `<div class="text-xs text-gray">${escapeHTML(p.note)}</div>` : '';
        return `
        <div class="list-item flex-between">
            <div>
              {/* Use formatCurrency for the payment amount */}
              <div class="text-sm">${formatCurrency(p.amount)}</div>
              <div class="text-xs text-gray">${new Date(p.date).toLocaleDateString()}</div>
              ${safeNote}
            </div>
            <button class="btn-icon text-red" data-action="delete-payment" data-payment-id="${p.id}" data-transaction-id="${transaction.id}">×</button>
        </div>`
    }).join('') || '<p class="text-sm text-gray">No payments yet</p>';

    showModal('Transaction Details', `
    <div class="mb-4"><strong>${safePersonName}</strong><br><span class="text-sm text-gray">${safeDescription}</span></div>
    <div class="mb-4">
      {/* Use formatCurrency for original amount and balance */}
      <div class="flex-between mb-2"><span>Original Amount:</span><span>${formatCurrency(transaction.amount)}</span></div>
      <div class="flex-between mb-2"><span>Current Balance:</span><span class="font-bold">${formatCurrency(balance)}</span></div>
      <div class="flex-between"><span>Status:</span><span class="${transaction.status === 'paid' ? 'text-green' : ''}">${transaction.status}</span></div>
    </div>
    <h3 class="font-bold mb-2">Payment History</h3><div class="list" id="paymentListContainer">${paymentsHtml}</div>
  `);

    document.getElementById('paymentListContainer').addEventListener('click', (e) => {
        if (e.target.dataset.action === 'delete-payment') {
            const paymentId = e.target.dataset.paymentId;
            const transactionId = e.target.dataset.transactionId;
            deletePayment(transactionId, paymentId);
        }
    });
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
    
    // 4. Sanitize the description before placing it in the input's value
    const safeDescription = escapeHTML(transaction.description || '');

    showModal(`Edit ${transaction.type}`, `
    <form id="editTransactionForm">
      <div class="form-group"><label class="label">Person</label><select name="personId" class="select" required>${personOptions}</select></div>
      <div class="form-group"><label class="label">Amount</label><input type="number" step="0.01" name="amount" class="input" value="${(transaction.amount / 100).toFixed(2)}" required></div>
      <div class="form-group"><label class="label">Description</label><input type="text" name="description" class="input" value="${safeDescription}" required></div>
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
    });
}

/**
 * Shows the modal for creating a new split expense.
 */
export function showSplitExpenseModal() {
    const {
        persons
    } = getState();
    const personOptions = persons.map(p => {
        const firstName = escapeHTML(p.firstName || '');
        const lastName = escapeHTML(p.lastName || '');
        return `<option value="${p.id}">${firstName} ${lastName}</option>`;
    }).join('');

    const participantCheckboxes = persons.map(p => `
        <label class="flex items-center">
            <input type="checkbox" name="participants" value="${p.id}" class="mr-2">
            ${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}
        </label>
    `).join('');

    showModal('Split Expense', `
        <form id="splitExpenseForm">
            <div class="form-group">
                <label class="label">Total Amount</label>
                <input type="number" step="0.01" name="totalAmount" class="input" placeholder="0.00" required>
            </div>
            <div class="form-group">
                <label class="label">Description</label>
                <input type="text" name="description" class="input" required>
            </div>

            <div class="form-group">
                <label class="label">Who Paid?</label>
                <select name="payerId" class="select" required>
                    <option value="ME">Me</option>
                    ${personOptions}
                </select>
            </div>

            <div class="form-group">
                <label class="label">Participants</label>
                <div class="flex flex-col">
                    <label class="flex items-center">
                        <input type="checkbox" name="participants" value="ME" class="mr-2"> Me
                    </label>
                    ${participantCheckboxes}
                </div>
                 <button type="button" id="addNewPersonBtn" class="btn btn-secondary text-sm mt-2">Add New Person</button>
            </div>


            <div class="form-group">
                <label class="label">How to Split?</label>
                <select name="splitType" class="select">
                    <option value="equal">Equally</option>
                </select>
            </div>

            <button type="submit" class="btn w-full">Create Split</button>
        </form>
    `);

    document.getElementById('addNewPersonBtn').addEventListener('click', () => {
        showPersonModal();
    });


    document.getElementById('splitExpenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const participantNodes = document.querySelectorAll('[name="participants"]:checked');
        const participants = Array.from(participantNodes).map(node => node.value);


        if (participants.length < 2) {
            showAlert('Please select at least two participants.');
            return;
        }


        const splitTransaction = {
            id: generateUUID(),
            type: TRANSACTION_TYPES.SPLIT,
            totalAmount: Math.round(parseFloat(formData.get('totalAmount')) * 100),
            description: formData.get('description'),
            date: new Date().toISOString().split('T')[0],
            payerId: formData.get('payerId'),
            participants, // Now an array of IDs
            splitType: formData.get('splitType'),
        };

        const childTransactions = generateIOUs(splitTransaction);

        const operations = [{
            type: 'put',
            storeName: 'transactions',
            value: splitTransaction
        }, ...childTransactions.map(t => ({
            type: 'put',
            storeName: 'transactions',
            value: t
        }))];

        await db.transact(operations);
        await loadData();
        closeModal();
    });
}