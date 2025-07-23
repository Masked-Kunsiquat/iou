// features/import-export/data-service.js

import { db } from '../../db.js';
import { app } from '../../core/state.js';
import { showAlert, showConfirm } from '../../ui/notifications.js';

/**
 * Exports all app data to a JSON file.
 */
export async function exportData() {
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
 * @param {Function} loadData - Function to reload data from the database.
 * @param {Function} render - Function to re-render the UI.
 */
export async function handleImport(e, loadData, render) {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Add file type validation for security.
    if (file.type !== 'application/json') {
        showAlert('Invalid file type. Please select a .json file.');
        e.target.value = ''; // Reset file input
        return;
    }


    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // 2. Add data structure validation.
            if (!data || !Array.isArray(data.persons) || !Array.isArray(data.transactions)) {
                throw new Error('Invalid data structure in JSON file. Required keys: "persons", "transactions".');
            }

            const shouldMerge = showConfirm('Merge with existing data? (Cancel to replace all data)');

            // 3. Add better error recovery.
            // By validating the structure first, we reduce the risk of partial writes.
            // A true transaction would require changes to db.js, but this is an improvement.
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
            // It's good practice to reload data to ensure the app state reflects the database
            // state, even if the import failed.
            await loadData();
            render();
        } finally {
            e.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}