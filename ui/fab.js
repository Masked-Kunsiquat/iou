/**
 * @file Manages the Floating Action Button (FAB).
 */

import { app } from '../core/state.js';
import { showPersonModal } from '../features/persons/person-modals.js';
import { showTransactionModal } from '../features/transactions/transaction-modals.js';

/**
 * Initializes the FAB and its event listener.
 */
export function initFab() {
  document.getElementById('fab').addEventListener('click', handleFabClick);
}

/**
 * Handles the click event on the FAB.
 * It shows the appropriate modal based on the current view.
 */
function handleFabClick() {
  if (app.currentView === 'persons') {
    showPersonModal();
  } else {
    showTransactionModal(app.currentView);
  }
}

/**
 * Hides or shows the FAB based on the current view.
 * @param {boolean} visible - Whether the FAB should be visible.
 */
export function setFabVisibility(visible) {
    const fab = document.getElementById('fab');
    fab.classList.toggle('hidden', !visible);
}