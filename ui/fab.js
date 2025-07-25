// ui/fab.js

import { getState } from '../core/state.js';
import { showPersonModal } from '../features/persons/person-modals.js';
import { showAddTransactionModal } from '../features/transactions/add-edit-transaction-modal.js';

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
 * It determines which modal content to load based on the current view.
 * Flowbite's data-modal-toggle attribute handles the actual showing of the modal.
 */
function handleFabClick() {
  const { currentView } = getState();
  if (currentView === 'persons') {
    // This function now correctly just injects the HTML
    showPersonModal(); 
  } else {
    showAddTransactionModal(currentView);
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