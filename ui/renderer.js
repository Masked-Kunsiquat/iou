// ui/renderer.js

import { app } from '../core/state.js';
import { setFabVisibility } from './fab.js';
import { formatPhone } from '../contact-helper.js';
import { deletePerson } from '../features/actions.js';
import { editPerson } from '../features/persons/person-modals.js';
import { deleteTransaction } from '../features/actions.js';
import { showEditTransactionModal, showPaymentModal, showTransactionDetails } from '../features/transactions/transaction-modals.js';
import { calculateBalance } from '../features/transactions/transaction-utils.js';

/**
 * Renders the main content based on the current view in the app state.
 */
export function render() {
    switch (app.currentView) {
        case 'iou':
            renderTransactionList('IOU');
            setFabVisibility(true);
            break;
        case 'uom':
            renderTransactionList('UOM');
            setFabVisibility(true);
            break;
        case 'stats':
            renderStats();
            setFabVisibility(false);
            break;
        case 'persons':
            renderPersons();
            setFabVisibility(true);
            break;
        default:
            renderTransactionList('IOU');
    }
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
            deleteTransaction(id);
            break;
    }
}

/**
 * Renders a list of transactions of a specific type ('IOU' or 'UOM').
 * @param {string} type - The type of transactions to render.
 */
function renderTransactionList(type) {
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
 * Renders the list of all persons.
 */
function renderPersons() {
    const main = document.getElementById('main');
    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">People</h2>
    <div class="list">
      ${app.persons.length === 0 ? '<p class="text-gray">No people added yet</p>' : ''}
      ${app.persons.map(p => `
        <div class="list-item">
          <div class="flex-between">
            <div>
              <div class="font-bold">${p.firstName} ${p.lastName}</div>
              <div class="text-sm text-gray">${formatPhone(p.phone)}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn-icon" data-action="edit-person" data-id="${p.id}">✏️</button>
              <button class="btn-icon text-red" data-action="delete-person" data-id="${p.id}">×</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
    // We will improve this in the next phase
    main.querySelectorAll('[data-action="edit-person"]').forEach(btn => btn.addEventListener('click', () => editPerson(btn.dataset.id)));
    main.querySelectorAll('[data-action="delete-person"]').forEach(btn => btn.addEventListener('click', () => deletePerson(btn.dataset.id)));
}

/**
 * Renders the statistics view, including the cash flow chart.
 */
function renderStats() {
    const iouTotal = app.transactions
        .filter(t => t.type === 'IOU')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const uomTotal = app.transactions
        .filter(t => t.type === 'UOM')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const netBalance = uomTotal - iouTotal;

    const overdueIOU = app.transactions.filter(t =>
        t.type === 'IOU' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const overdueUOM = app.transactions.filter(t =>
        t.type === 'UOM' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const main = document.getElementById('main');

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Statistics</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value ${netBalance >= 0 ? 'text-green' : 'text-red'}">
          $${Math.abs(netBalance / 100).toFixed(2)}
        </div>
        <div class="stat-label">Net Balance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">${(iouTotal / 100).toFixed(2)}</div>
        <div class="stat-label">Total I Owe</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">${(uomTotal / 100).toFixed(2)}</div>
        <div class="stat-label">Total Owed to Me</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${overdueIOU + overdueUOM}</div>
        <div class="stat-label">Overdue Items</div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-bold mb-4">Monthly Cash Flow</h3>
      <div style="position: relative; height: 300px;">
        <canvas id="chartCanvas"></canvas>
      </div>
    </div>
  `;
    renderChart();
}

/**
 * Renders the Chart.js bar chart for monthly cash flow.
 */
function renderChart() {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[key] = { inflow: 0, outflow: 0 };
    }

    app.transactions.forEach(t => {
        const date = new Date(t.date);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyData[key]) {
            if (t.type === 'UOM') {
                monthlyData[key].inflow += t.amount / 100;
            } else {
                monthlyData[key].outflow += t.amount / 100;
            }
        }
    });

    const labels = Object.keys(monthlyData);
    const inflow = labels.map(k => monthlyData[k].inflow);
    const outflow = labels.map(k => monthlyData[k].outflow);

    if (app.chart) app.chart.destroy();

    app.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Money In', data: inflow, backgroundColor: '#10b981' },
                { label: 'Money Out', data: outflow, backgroundColor: '#ef4444' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: value => '$' + value } } }
        }
    });
}