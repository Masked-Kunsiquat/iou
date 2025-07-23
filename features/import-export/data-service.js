/**
 * @file Manages data import and export functionality.
 */

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