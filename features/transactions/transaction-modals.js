// features/transactions/transaction-modals.js

import { db } from '../../db.js';
import { getState } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { deletePayment } from '../actions.js';
import { calculateBalance } from './transaction-utils.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

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
      <div class="mb-2"><strong>${safePersonName}</strong><br><span class="text-sm text-gray">Balance: ${(balance / 100).toFixed(2)}</span></div>
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
    
    // 1. Sanitize all user-provided data before rendering
    const safePersonName = person ? escapeHTML(`${person.firstName} ${person.lastName}`) : 'Unknown Person';
    const safeDescription = escapeHTML(transaction.description || '');

    const paymentsHtml = transaction.payments?.map(p => {
        // 2. Sanitize the payment note to prevent XSS
        const safeNote = p.note ? `<div class="text-xs text-gray">${escapeHTML(p.note)}</div>` : '';
        return `
        <div class="list-item flex-between">
            <div>
              <div class="text-sm">${(p.amount / 100).toFixed(2)}</div>
              <div class="text-xs text-gray">${new Date(p.date).toLocaleDateString()}</div>
              ${safeNote}
            </div>
            <button class="btn-icon text-red" data-action="delete-payment" data-payment-id="${p.id}" data-transaction-id="${transaction.id}">×</button>
        </div>`
    }).join('') || '<p class="text-sm text-gray">No payments yet</p>';

    // 3. Use the sanitized variables in the template literal
    showModal('Transaction Details', `
    <div class="mb-4"><strong>${safePersonName}</strong><br><span class="text-sm text-gray">${safeDescription}</span></div>
    <div class="mb-4">
      <div class="flex-between mb-2"><span>Original Amount:</span><span>${(transaction.amount / 100).toFixed(2)}</span></div>
      <div class="flex-between mb-2"><span>Current Balance:</span><span class="font-bold">${(balance / 100).toFixed(2)}</span></div>
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