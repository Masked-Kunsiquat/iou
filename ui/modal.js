/**
 * @file Manages the application's modal dialog system.
 */

// We need a reference to the main app to access render functions
let app;

/**
 * Initializes the modal system and sets up its event listeners.
 * @param {object} mainApp - The main application object.
 */
export function initModal(mainApp) {
  app = mainApp;
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    // Close modal if the outer background is clicked
    if (e.target.id === 'modal') {
      closeModal();
    }
  });
}

/**
 * Displays the modal with a given title and content.
 * @param {string} title - The title to display in the modal header.
 * @param {string} content - The HTML content to display in the modal body.
 */
export function showModal(title, content) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modal').classList.remove('hidden');
}

/**
 * Hides the modal from view.
 */
export function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalTitle').textContent = '';
  document.getElementById('modalBody').innerHTML = '';
}