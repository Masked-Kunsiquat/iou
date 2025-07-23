/**
 * @file Manages the Floating Action Button (FAB).
 */

// App reference to know the current view and show modals
let app;

/**
 * Initializes the FAB and its event listener.
 * @param {object} mainApp - The main application object.
 */
export function initFab(mainApp) {
  app = mainApp;
  document.getElementById('fab').addEventListener('click', handleFabClick);
}

/**
 * Handles the click event on the FAB.
 * It shows the appropriate modal based on the current view.
 */
function handleFabClick() {
  if (app.currentView === 'persons') {
    // The showPersonModal logic is in app.js, so we call it via the app object
    app.showPersonModal();
  } else {
    // The showTransactionModal logic is in app.js
    app.showTransactionModal(app.currentView);
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