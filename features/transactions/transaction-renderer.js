// features/transactions/transaction-renderer.js

import { getState, setState } from '../../core/state.js';
import { calculateBalance } from './transaction-utils.js';
import { showPaymentModal, showTransactionDetails, showEditTransactionModal } from './transaction-modals.js';
import { deleteTransaction } from '../actions.js';
import { escapeHTML } from '../../ui/html-sanitizer.js';

/**
 * Handles clicks on action buttons within a transaction card.
 * @param {Event} e - The click event.
 */
function handleTransactionAction(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    const { transactions } = getState();
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
 * Generates the HTML for a single transaction card.
 * @param {object} transaction - The transaction object to render.
 * @returns {string} HTML string for the transaction card.
 */
function renderTransaction(transaction) {
    const { persons } = getState();
    const person = persons.find(p => p.id === transaction.personId);
    const balance = calculateBalance(transaction);
    const isPaid = balance === 0;
    const isOverdue = transaction.dueDate && new Date(transaction.dueDate) < new Date() && !isPaid;

    // Sanitize user-provided data before rendering to prevent XSS
    const firstName = escapeHTML(person?.firstName || '');
    const lastName = escapeHTML(person?.lastName || '');
    const description = escapeHTML(transaction.description || '');

    return `
    <div class="card" data-id="${transaction.id}" ${isPaid ? 'style="opacity: 0.6;"' : ''}>
      <div class="card-header">
        <div>
          <div class="font-bold">${firstName} ${lastName}</div>
          <div class="text-sm text-gray">${description}</div>
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
    const { transactions, persons, transactionSort, showPaid } = getState();
    const main = document.getElementById('main');
    
    if (!main) {
        console.error('Fatal Error: The "main" element was not found in the DOM.');
        return;
    }

    // 1. Filter transactions by type and paid status
    let filteredTransactions = transactions.filter(t => t.type === type);
    if (!showPaid) {
        filteredTransactions = filteredTransactions.filter(t => calculateBalance(t) > 0);
    }

    // 2. Group transactions by person
    const transactionsByPerson = filteredTransactions.reduce((acc, t) => {
        if (!acc[t.personId]) {
            acc[t.personId] = [];
        }
        acc[t.personId].push(t);
        return acc;
    }, {});

    // 3. Sort the persons based on the chosen sort order
    const sortedPersonIds = Object.keys(transactionsByPerson).sort((a, b) => {
        const personA = persons.find(p => p.id === a);
        const personB = persons.find(p => p.id === b);
        if (!personA || !personB) return 0;

        if (transactionSort.by === 'name') {
            const nameA = `${personA.firstName} ${personA.lastName}`;
            const nameB = `${personB.firstName} ${personB.lastName}`;
            return transactionSort.order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        } else { // Default to date sort
            const latestDateA = Math.max(...transactionsByPerson[a].map(t => new Date(t.date).getTime()));
            const latestDateB = Math.max(...transactionsByPerson[b].map(t => new Date(t.date).getTime()));
            return transactionSort.order === 'asc' ? latestDateA - latestDateB : latestDateB - latestDateA;
        }
    });
    
    // 4. Generate the final HTML
    const listHtml = sortedPersonIds.map(personId => {
        const person = persons.find(p => p.id === personId);
        if (!person) return '';

        const personTransactions = transactionsByPerson[personId];
        // Sort transactions for each person by date
        personTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const personHeader = `<h3 class="font-bold text-lg mt-4 mb-2">${escapeHTML(person.firstName)} ${escapeHTML(person.lastName)}</h3>`;
        const transactionsHtml = personTransactions.map(t => renderTransaction(t)).join('');
        return personHeader + transactionsHtml;
    }).join('');

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">${type === 'IOU' ? 'I Owe' : 'Owed to Me'}</h2>
    
    <div class="flex-between mb-4 flex-wrap gap-2">
        <div>
            <label for="sort-by" class="text-sm">Sort by:</label>
            <select id="sort-by" class="select" style="width: auto;">
                <option value="date_desc" ${transactionSort.by === 'date' && transactionSort.order === 'desc' ? 'selected' : ''}>Date (Newest)</option>
                <option value="date_asc" ${transactionSort.by === 'date' && transactionSort.order === 'asc' ? 'selected' : ''}>Date (Oldest)</option>
                <option value="name_asc" ${transactionSort.by === 'name' && transactionSort.order === 'asc' ? 'selected' : ''}>Person (A-Z)</option>
                <option value="name_desc" ${transactionSort.by === 'name' && transactionSort.order === 'desc' ? 'selected' : ''}>Person (Z-A)</option>
            </select>
        </div>
        <div>
            <label class="align-center flex">
                <input type="checkbox" id="show-paid" class="mr-2" ${showPaid ? 'checked' : ''}>
                <span class="text-sm">Show Paid</span>
            </label>
        </div>
    </div>

    <div class="list">
      ${listHtml.length === 0 ? '<p class="text-gray">No transactions yet</p>' : listHtml}
    </div>
  `;

    // 5. Add event listeners for the new controls
    document.getElementById('sort-by').addEventListener('change', (e) => {
        const [by, order] = e.target.value.split('_');
        setState({ transactionSort: { by, order } });
    });

    document.getElementById('show-paid').addEventListener('change', (e) => {
        setState({ showPaid: e.target.checked });
    });

    main.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', handleTransactionAction);
    });
}