/**
 * @file Centralized data modification actions (delete operations).
 */

import { db } from '../db.js';
import { app } from '../core/state.js';
import { showConfirm, showAlert } from '../ui/notifications.js';
import { closeModal } from '../ui/modal.js';
import { calculateBalance } from './transactions/transaction-utils.js';

// Dependencies from other modules, to be initialized
let loadData;
let render;

/**
 * Initializes the actions module with required functions from other modules.
 * @param {object} dependencies - The functions to inject.
 */
export function initActions(dependencies) {
    loadData = dependencies.loadData;
    render = dependencies.render;
}

/**
 * Deletes a transaction after confirmation.
 * @param {string} transactionId - The ID of the transaction to delete.
 */
export async function deleteTransaction(transactionId) {
    const transaction = app.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

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
export async function deletePayment(transactionId, paymentId) {
    if (!showConfirm('Delete this payment?')) return;

    const transaction = app.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    transaction.payments = transaction.payments.filter(p => p.id !== paymentId);

    // If there's a balance remaining, the status should be pending
    if (calculateBalance(transaction) > 0) {
        transaction.status = 'pending';
    }

    await db.put('transactions', transaction);
    await loadData();
    closeModal(); // Close the details modal if open
    render();
};

/**
 * Deletes a person after confirming they have no associated transactions.
 * @param {string} personId - The ID of the person to delete.
 */
export async function deletePerson(personId) {
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