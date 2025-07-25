// features/import-export/data-service.js

import { db } from '../../db.js';
import { getState } from '../../core/state.js';
import { showAlert, showConfirm } from '../../ui/notifications.js';

/**
 * Exports all app data to a JSON file.
 */
export async function exportData() {
    const { persons, transactions } = getState();
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        persons: persons,
        transactions: transactions
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
 * Validates the structure of a single transaction object.
 * @param {object} t - The transaction object.
 * @returns {boolean} - True if the transaction is valid, false otherwise.
 */
function isValidTransaction(t) {
    if (!t || !t.id || !t.type) return false;

    const hasBaseFields = typeof t.description === 'string' && typeof t.date === 'string';
    if (!hasBaseFields) return false;

    switch (t.type) {
        case TRANSACTION_TYPES.SPLIT:
            return typeof t.totalAmount === 'number' &&
                typeof t.payerId === 'string' &&
                Array.isArray(t.participants);
        case TRANSACTION_TYPES.IOU:
        case TRANSACTION_TYPES.UOM:
            return typeof t.personId === 'string' &&
                typeof t.amount === 'number' &&
                Array.isArray(t.payments);
        default:
            return false;
    }
}

/**
 * Imports data from a JSON file, either merging or replacing existing data.
 * @param {Event} e - The file input change event.
 * @param {Function} loadData - Function to reload data from the database and update state.
 */
export async function handleImport(e, loadData) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
        showAlert('Invalid file type. Please select a .json file.');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);

            if (!data || !Array.isArray(data.persons) || !Array.isArray(data.transactions)) {
                throw new Error('Invalid data structure. Required keys: "persons", "transactions".');
            }

            // Validate every transaction before proceeding
            for (const t of data.transactions) {
                if (!isValidTransaction(t)) {
                    throw new Error(`Invalid transaction object found with id: ${t.id || 'N/A'}`);
                }
            }


            const shouldMerge = showConfirm('Merge with existing data? (Cancel to replace all data)');

            if (!shouldMerge) {
                await db.clear('persons');
                await db.clear('transactions');
            }

            for (const person of data.persons) await db.put('persons', person);
            for (const transaction of data.transactions) await db.put('transactions', transaction);

            await loadData();
            showAlert('Data imported successfully!');
        } catch (err) {
            showAlert('Error importing data: ' + err.message);
            await loadData();
        } finally {
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}
