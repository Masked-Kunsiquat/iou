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

    // Get all transactions for the current type *before* applying visibility filters.
    const allTransactionsForType = transactions.filter(t => t.type === type);

    // 1. Filter transactions by paid status
    let filteredTransactions = allTransactionsForType;
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
        } else { // Date-based sorting
            let dateA, dateB;
            if (transactionSort.by === 'dueDate') {
                // Get all valid due dates, convert to timestamps
                const dueDatesA = transactionsByPerson[a].map(t => t.dueDate ? new Date(t.dueDate).getTime() : null).filter(Boolean);
                const dueDatesB = transactionsByPerson[b].map(t => t.dueDate ? new Date(t.dueDate).getTime() : null).filter(Boolean);
                
                // If a person has no due dates, push them to the end when sorting
                if (dueDatesA.length === 0 && dueDatesB.length > 0) return 1;
                if (dueDatesB.length === 0 && dueDatesA.length > 0) return -1;
                if (dueDatesA.length === 0 && dueDatesB.length === 0) return 0;
                
                dateA = transactionSort.order === 'asc' ? Math.min(...dueDatesA) : Math.max(...dueDatesA);
                dateB = transactionSort.order === 'asc' ? Math.min(...dueDatesB) : Math.max(...dueDatesB);

            } else { // Default to transactionDate
                dateA = Math.max(...transactionsByPerson[a].map(t => new Date(t.date).getTime()));
                dateB = Math.max(...transactionsByPerson[b].map(t => new Date(t.date).getTime()));
            }

            return transactionSort.order === 'asc' ? dateA - dateB : dateB - dateA;
        }
    });
    
    // 4. Generate the final HTML
    const listHtml = sortedPersonIds.map(personId => {
        const person = persons.find(p => p.id === personId);
        if (!person) return '';

        const personTransactions = transactionsByPerson[personId];
        // Sort transactions for each person by date (newest first)
        personTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const personHeader = `<h3 class="font-bold text-lg mt-4 mb-2">${escapeHTML(person.firstName)} ${escapeHTML(person.lastName)}</h3>`;
        const transactionsHtml = personTransactions.map(t => renderTransaction(t)).join('');
        return personHeader + transactionsHtml;
    }).join('');
    
    // Determine the correct empty state message based on context
    let emptyMessage = '';
    if (listHtml.length === 0) {
        if (allTransactionsForType.length === 0) {
            emptyMessage = '<p class="text-gray">No transactions yet</p>';
        } else {
            emptyMessage = '<p class="text-gray">No transactions match your filters</p>';
        }
    }

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">${type === 'IOU' ? 'I Owe' : 'Owed to Me'}</h2>
    
    <div class="flex-between mb-4 flex-wrap gap-2">
        <div>
            <label for="sort-by" class="text-sm mr-2">Sort by:</label>
            <select id="sort-by" class="select" style="width: auto;">
                <option value="transactionDate_desc" ${transactionSort.by === 'transactionDate' && transactionSort.order === 'desc' ? 'selected' : ''}>Transaction Date (Newest)</option>
                <option value="transactionDate_asc" ${transactionSort.by === 'transactionDate' && transactionSort.order === 'asc' ? 'selected' : ''}>Transaction Date (Oldest)</option>
                <option value="dueDate_asc" ${transactionSort.by === 'dueDate' && transactionSort.order === 'asc' ? 'selected' : ''}>Due Date (Soonest)</option>
                <option value="dueDate_desc" ${transactionSort.by === 'dueDate' && transactionSort.order === 'desc' ? 'selected' : ''}>Due Date (Latest)</option>
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
      ${listHtml.length === 0 ? emptyMessage : listHtml}
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