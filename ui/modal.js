/**
 * @file Manages the application's modal dialog system.
 */

/**
 * Initializes the modal system and sets up its event listeners.
 * It now includes checks to ensure the required DOM elements exist.
 */
export function initModal() {
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  } else {
    console.warn('Modal close button with id "modalClose" not found.');
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Close modal if the outer background is clicked
      if (e.target.id === 'modal') {
        closeModal();
      }
    });
  } else {
      console.warn('Modal container with id "modal" not found.');
  }
}

/**
 * Displays the modal with a given title and content.
 * @param {string} title - The title to display in the modal header.
 * @param {string} content - The HTML content for the modal body.
 * IMPORTANT: This function assumes the 'content' is safe and has been
 * sanitized or is internally generated. Using raw user input here
 * could expose the application to XSS vulnerabilities.
 */
export function showModal(title, content) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (modalTitle) {
    modalTitle.textContent = title;
  }
  
  if (modalBody) {
    modalBody.innerHTML = content;
  }

  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Hides the modal from view and clears its content.
 */
export function closeModal() {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (modal) {
    modal.classList.add('hidden');
  }

  if (modalTitle) {
    modalTitle.textContent = '';
  }
  
  if (modalBody) {
    modalBody.innerHTML = '';
  }
}

/**
 * Shows a simple action sheet style modal.
 * @param {string} title - The title for the action sheet.
 * @param {Array<{label: string, action: function}>} actions - The actions to display.
 */
export function showActionSheet(title, actions) {
    const actionsHtml = actions.map((action, index) =>
        `<button class="btn btn-secondary w-full mb-2" data-action-index="${index}">${action.label}</button>`
    ).join('');

    showModal(title, actionsHtml);

    document.getElementById('modalBody').addEventListener('click', (e) => {
        const button = e.target.closest('[data-action-index]');
        if (button) {
            const index = parseInt(button.dataset.actionIndex, 10);
            if (actions[index] && typeof actions[index].action === 'function') {
                actions[index].action();
            }
        }
    });
}