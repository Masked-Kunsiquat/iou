// core/main.js

import { db } from '../db.js';
import { app } from './state.js';

// Import UI Modules
import { initModal } from '../ui/modal.js';
import { initFab } from '../ui/fab.js';
import { initNavigation } from '../ui/navigation.js';
import { showAlert, showConfirm } from '../ui/notifications.js';
import { initRenderer, render } from '../ui/renderer.js';

// Import Feature Modules
import { initActions, deleteTransaction, deletePayment } from '../features/actions.js';
import { initPersonModals } from '../features/persons/person-modals.js';
import { initTransactionModals, showEditTransactionModal, showPaymentModal, showTransactionDetails } from '../features/transactions/transaction-modals.js';


// =================================================================================================
// INITIALIZATION
// =================================================================================================

/**
 * Initializes the application, loads data, and sets up UI modules.
 */
export async function init() {
    await db.init();
    await loadData();

    // Pass dependencies to the renderer module
    initRenderer({
        calculateBalance,
        handleTransactionAction,
    });

    // Initialize feature modules
    initActions({
        loadData,
        render,
        calculateBalance,
    });

    initPersonModals({
        loadData,
        render,
    });

    initTransactionModals({
        calculateBalance,
        deletePayment,
        loadData,
        render,
    });


    // Initialize UI modules, passing the app object for context
    initModal({ render });
    initFab();
    initNavigation({ render });

    setupEventListeners();
    registerServiceWorker();

    document.getElementById('versionBadge').textContent = `v${app.version}`;
    render(); // Initial render
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

    // Add a global listener for hash changes to re-render
    window.addEventListener('hashchange', () => {
        app.currentView = window.location.hash.slice(1) || 'iou';
        render();
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

    // For delete, the transaction object may no longer exist.
    // For other actions, we find it.
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
            // Call the imported delete function
            deleteTransaction(id);
            break;
    }
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