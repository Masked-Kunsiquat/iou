// features/transactions/transaction-renderer.js

import { app } from '../../core/state.js';
import { calculateBalance } from './transaction-utils.js';
import { showPaymentModal, showTransactionDetails, showEditTransactionModal } from './transaction-modals.js';
import { deleteTransaction } from '../actions.js';

/**
 * Handles clicks on action buttons within a transaction card.
 * @param {Event} e - The click event.
 */
function handleTransactionAction(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    const transaction = app.transactions.find(t => t.id === id);

    if (!transaction) return;

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
            deleteTransaction(id);
            break;
    }
}

/**
 * Generates the HTML for a single transaction card.
 * @param {object} transaction - The transaction object to render.
 * @returns {string} HTML string for the transaction card.
 */
function renderTransaction(transaction) {
    const person = app.persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);
    const isPaid = balance === 0;
    const isOverdue = transaction.dueDate && new Date(transaction.dueDate) < new Date() && !isPaid;

    return `
    <div class="card" data-id="${transaction.id}">
      <div class="card-header">
        <div>
          <div class="font-bold">${person?.firstName || ''} ${person?.lastName || ''}</div>
          <div class="text-sm text-gray">${transaction.description}</div>
          <div class="text-xs text-gray mt-1">
            ${new Date(transaction.date).toLocaleDateString()}
            ${transaction.dueDate ? ` • Due: ${new Date(transaction.dueDate).toLocaleDateString()}` : ''}
            ${isOverdue ? '<span class="text-red"> (Overdue)</span>' : ''}
            ${isPaid ? '<span class="text-green"> (Paid)</span>' : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold">${(balance / 100).toFixed(2)}</div>
          <div class="text-xs text-gray">of ${(transaction.amount / 100).toFixed(2)}</div>
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <button class="btn btn-secondary text-sm" data-action="payment" data-id="${transaction.id}">Add Payment</button>
        <button class="btn btn-secondary text-sm" data-action="details" data-id="${transaction.id}">Details</button>
        <button class="btn btn-secondary text-sm" data-action="edit" data-id="${transaction.id}">Edit</button>
        <button class="btn btn-secondary text-sm text-red" data-action="delete" data-id="${transaction.id}">Delete</button>
      </div>
    </div>
  `;
}

/**
 * Renders a list of transactions of a specific type ('IOU' or 'UOM').
 * @param {string} type - The type of transactions to render.
 */
export function renderTransactionList(type) {
    const transactions = app.transactions.filter(t => t.type === type);
    const main = document.getElementById('main');

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">${type === 'IOU' ? 'I Owe' : 'Owed to Me'}</h2>
    <div class="list">
      ${transactions.length === 0 ? '<p class="text-gray">No transactions yet</p>' : ''}
      ${transactions.map(t => renderTransaction(t)).join('')}
    </div>
  `;

    main.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', handleTransactionAction);
    });
}