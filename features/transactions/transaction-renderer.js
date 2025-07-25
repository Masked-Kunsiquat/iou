// features/transactions/transaction-renderer.js

import { getState, setState } from '../../core/state.js';
import { calculateBalance } from './transaction-utils.js';
import { showPaymentModal, showTransactionDetails, showEditTransactionModal } from './transaction-modals.js';
import { deleteTransaction } from '../actions.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';
import { formatCurrency } from '../../ui/currency.js';

/**
 * Handles clicks on action buttons within a transaction card.
 * @param {Event} e - The click event.
 */
function handleTransactionAction(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    const {
        transactions
    } = getState();
    const transaction = transactions.find(t => t.id === id);

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
 * Renders the HTML for a single transaction card, with special rendering for SPLIT types.
 * @param {object} transaction - The transaction object to render.
 * @param {Array<object>} persons - The array of all person objects.
 * @returns {string} HTML string for the transaction card.
 */
function renderTransaction(transaction, persons = []) {
    if (transaction.type === 'SPLIT') {
        const payer = transaction.payerId === 'ME' ? {
            firstName: 'You'
        } : persons.find(p => p.id === transaction.payerId);
        const payerName = payer ? escapeHTML(`${payer.firstName} ${payer.lastName || ''}`.trim()) : 'Unknown';

        const participantsHtml = transaction.participants.map(pId => {
            const participant = pId === 'ME' ? {
                firstName: 'You',
                id: 'ME'
            } : persons.find(p => p.id === pId);
            if (!participant) return '';

            const isPayer = participant.id === transaction.payerId;
            const isMe = participant.id === 'ME';

            // Custom styling for participants based on their role in the split
            let style = 'background-color: #e5e7eb; color: #374151;'; // Default
            if (isPayer) style = 'background-color: #dbeafe; color: #1e40af;'; // Payer: blue
            if (isMe && !isPayer) style = 'background-color: #d1fae5; color: #065f46;'; // Me (not payer): green

            return `<span class="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded" style="${style}">${escapeHTML(participant.firstName)}</span>`;

        }).join('');

        return `
        <div class="card" data-id="${transaction.id}">
          <div class="card-header">
            <div>
              <div class="font-bold">${escapeHTML(transaction.description)}</div>
              <div class="text-xs text-gray mt-1">${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div class="text-right">
              <div class="font-bold">${formatCurrency(transaction.totalAmount)}</div>
              <div class="text-xs text-gray">Total Split</div>
            </div>
          </div>
          <div class="mt-2">
            <p class="text-sm">Paid by: <strong>${payerName}</strong></p>
            <div class="mt-2">
              <p class="text-sm mb-2">Participants:</p>
              <div class="flex flex-wrap gap-2">${participantsHtml}</div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button class="btn btn-secondary text-sm text-red" data-action="delete" data-id="${transaction.id}">Delete</button>
          </div>
        </div>
      `;
    }

    // Default rendering for standard IOU/UOM cards
    const balance = calculateBalance(transaction);
    const isPaid = balance === 0;
    const isOverdue = transaction.dueDate && new Date(transaction.dueDate) < new Date() && !isPaid;
    const description = escapeHTML(transaction.description || 'No Description');

    return `
    <div class="card" data-id="${transaction.id}" ${isPaid ? 'style="opacity: 0.6;"' : ''}>
      <div class="card-header">
        <div>
          <div class="font-bold">${description}</div>
          <div class="text-xs text-gray mt-1">
            ${new Date(transaction.date).toLocaleDateString()}
            ${transaction.dueDate ? ` • Due: ${new Date(transaction.dueDate).toLocaleDateString()}` : ''}
            ${isOverdue ? '<span class="text-red"> (Overdue)</span>' : ''}
            ${isPaid ? '<span class="text-green"> (Paid)</span>' : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold">${formatCurrency(balance)}</div>
          <div class="text-xs text-gray">of ${formatCurrency(transaction.amount)}</div>
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
 * Renders a list of transactions, grouping by tags and condensing splits into single cards.
 * @param {string} type - The type of transactions to render ('IOU' or 'UOM').
 */
export function renderTransactionList(type) {
    const {
        transactions,
        persons,
        showPaid
    } = getState();
    const main = document.getElementById('main');

    if (!main) {
        console.error('Fatal Error: The "main" element was not found in the DOM.');
        return;
    }

    // 1. Filter for relevant child transactions (IOU or UOM)
    const relevantChildTransactions = transactions.filter(t => t.type === type && (showPaid || calculateBalance(t) > 0));

    // 2. Identify master SPLIT transactions to show and standalone transactions
    const splitIdsToShow = new Set(relevantChildTransactions.filter(t => t.splitId).map(t => t.splitId));
    const standaloneTransactions = relevantChildTransactions.filter(t => !t.splitId);
    const splitMasterTransactions = transactions.filter(t => t.type === 'SPLIT' && splitIdsToShow.has(t.id));

    const displayItems = [...standaloneTransactions, ...splitMasterTransactions];

    // 3. Group items by their groupTag
    const itemsByGroup = displayItems.reduce((acc, item) => {
        const groupKey = item.groupTag || 'Uncategorized';
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});

    const sortedGroupKeys = Object.keys(itemsByGroup).sort((a, b) => a.localeCompare(b));

    // 4. Generate the final HTML
    const listHtml = sortedGroupKeys.map(groupKey => {
        const groupItems = itemsByGroup[groupKey];
        groupItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        const groupHeader = `<h3 class="font-bold text-lg mt-4 mb-2">${escapeHTML(groupKey)}</h3>`;
        const transactionsHtml = groupItems.map(t => renderTransaction(t, persons)).join('');
        return groupHeader + transactionsHtml;
    }).join('');

    let emptyMessage = '';
    if (displayItems.length === 0) {
        emptyMessage = transactions.some(t => t.type === type) ?
            '<p class="text-gray">No transactions match your filters</p>' :
            '<p class="text-gray">No transactions yet</p>';
    }

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">${type === 'IOU' ? 'I Owe' : 'Owed to Me'}</h2>
    <div class="flex-between mb-4 flex-wrap gap-2">
        <div>
            <label class="align-center flex">
                <input type="checkbox" id="show-paid" class="mr-2" ${showPaid ? 'checked' : ''}>
                <span class="text-sm">Show Paid</span>
            </label>
        </div>
    </div>
    <div class="list">
      ${listHtml.length > 0 ? listHtml : emptyMessage}
    </div>
  `;

    // 5. Add event listeners
    document.getElementById('show-paid').addEventListener('change', (e) => {
        setState({
            showPaid: e.target.checked
        });
    });

    main.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', handleTransactionAction);
    });
}