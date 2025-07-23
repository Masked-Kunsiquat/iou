import { db } from './db.js';
import { generatePersonId, pickContact, formatPhone } from './contact-helper.js';

// Import UI Modules
import { initModal, showModal, closeModal } from './ui/modal.js';
import { initFab, setFabVisibility } from './ui/fab.js';
import { initNavigation } from './ui/navigation.js';
import { showAlert, showConfirm } from './ui/notifications.js';

// Global app state
const app = {
  version: '1.0.2',
  persons: [],
  transactions: [],
  currentView: 'iou',
  currentTransaction: null,
  chart: null,
  // Make key functions available to modules that need them
  render,
  showPersonModal,
  showTransactionModal,
};

// =================================================================================================
// INITIALIZATION
// =================================================================================================

/**
 * Initializes the application, loads data, and sets up UI modules.
 */
async function init() {
  await db.init();
  await loadData();

  // Initialize UI modules, passing the app object for context
  initModal(app);
  initFab(app);
  initNavigation(app);

  setupEventListeners();
  registerServiceWorker();

  document.getElementById('versionBadge').textContent = `v${app.version}`;
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
}

// =================================================================================================
// RENDERING
// =================================================================================================

/**
 * Renders the main content based on the current view in the app state.
 */
function render() {
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
              <button class="btn-icon" onclick="editPerson('${p.id}')">✏️</button>
              <button class="btn-icon text-red" onclick="deletePerson('${p.id}')">×</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
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
window.deletePayment = async function(transactionId, paymentId) {
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
window.deletePerson = async function(personId) {
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
window.editPerson = function(personId) {
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

// Initialize the app when the script loads
init();