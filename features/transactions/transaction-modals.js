// features/transactions/transaction-modals.js

import { db } from '../../db.js';
import { app } from '../../core/state.js';
import { showModal, closeModal } from '../../ui/modal.js';
import { deletePayment } from '../actions.js';
import { calculateBalance } from './transaction-utils.js';

let loadData;
let render;

export function initTransactionModals(dependencies) {
    loadData = dependencies.loadData;
    render = dependencies.render;
}

/**
 * Shows the modal for adding a new transaction.
 * @param {string} type - The type of transaction ('IOU' or 'UOM').
 */
export function showTransactionModal(type) {
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
export function showPaymentModal(transaction) {
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
export function showTransactionDetails(transaction) {
    const person = app.persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);
    const paymentsHtml = transaction.payments?.map(p => `
    <div class="list-item flex-between">
        <div>
          <div class="text-sm">${(p.amount / 100).toFixed(2)}</div>
          <div class="text-xs text-gray">${new Date(p.date).toLocaleDateString()}</div>
          ${p.note ? `<div class="text-xs text-gray">${p.note}</div>` : ''}
        </div>
        <button class="btn-icon text-red" data-action="delete-payment" data-payment-id="${p.id}" data-transaction-id="${transaction.id}">×</button>
    </div>`
    ).join('') || '<p class="text-sm text-gray">No payments yet</p>';

    showModal('Transaction Details', `
    <div class="mb-4"><strong>${person?.firstName} ${person?.lastName}</strong><br><span class="text-sm text-gray">${transaction.description}</span></div>
    <div class="mb-4">
      <div class="flex-between mb-2"><span>Original Amount:</span><span>${(transaction.amount / 100).toFixed(2)}</span></div>
      <div class="flex-between mb-2"><span>Current Balance:</span><span class="font-bold">${(balance / 100).toFixed(2)}</span></div>
      <div class="flex-between"><span>Status:</span><span class="${transaction.status === 'paid' ? 'text-green' : ''}">${transaction.status}</span></div>
    </div>
    <h3 class="font-bold mb-2">Payment History</h3><div class="list" id="paymentListContainer">${paymentsHtml}</div>
  `);

    // Attach event listener to the container for payment deletion
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