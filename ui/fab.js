// ui/fab.js

import {
    getState
} from '../core/state.js';
import {
    showPersonModal
} from '../features/persons/person-modals.js';
import {
    showTransactionModal,
    showSplitExpenseModal
} from '../features/transactions/transaction-modals.js';
import {
    showActionSheet
} from './modal.js';

/**
 * Initializes the FAB and its event listener.
 */
export function initFab() {
    const fab = document.getElementById('fab');
    if (fab) {
        fab.addEventListener('click', handleFabClick);
    } else {
        console.error('Error: The FAB element was not found in the DOM.');
    }
}

/**
 * Handles the click event on the FAB.
 * It shows the appropriate modal based on the current view.
 */
function handleFabClick() {
    const {
        currentView
    } = getState();

    if (currentView === 'persons') {
        showPersonModal();
    } else {
        showActionSheet('Add New', [{
            label: 'I Owe (IOU)',
            action: () => showTransactionModal('IOU')
        }, {
            label: 'Owed to Me (UOM)',
            action: () => showTransactionModal('UOM')
        }, {
            label: 'Split Expense',
            action: () => showSplitExpenseModal()
        }, ]);
    }
}

/**
 * Hides or shows the FAB based on the current view.
 * @param {boolean} visible - Whether the FAB should be visible.
 */
export function setFabVisibility(visible) {
    const fab = document.getElementById('fab');
    if (fab) {
        fab.classList.toggle('hidden', !visible);
    }
}