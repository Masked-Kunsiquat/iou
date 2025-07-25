/**
 * @file Manages the application's modal dialog system using Flowbite.
 */

// This will hold the Flowbite Modal instance. We will create it on demand.
let modalInstance = null;

/**
 * Gets the singleton instance of the Flowbite Modal.
 * If it doesn't exist, it creates one.
 * @returns {import('flowbite').ModalInterface}
 */
function getModal() {
    if (!modalInstance) {
        const modalElement = document.getElementById('app-modal');
        const modalOptions = {
            placement: 'center',
            backdrop: 'static',
            closable: true,
        };
        // Create the instance only when it's first needed.
        modalInstance = new Flowbite.Modal(modalElement, modalOptions);
    }
    return modalInstance;
}


/**
 * Initializes the modal system.
 * This function only hooks up the close button listener.
 */
export function initModal() {
    const modalCloseButton = document.getElementById('modalClose');
    if (modalCloseButton) {
        // The event listener will call getModal(), which ensures
        // the instance exists before we try to hide it.
        modalCloseButton.addEventListener('click', () => getModal().hide());
    } else {
        console.warn('Modal close button with id "modalClose" not found.');
    }
}

/**
 * Displays the modal with a given title and content.
 * @param {string} title - The title to display in the modal header.
 * @param {string} content - The HTML content for the modal body.
 */
export function showModal(title, content) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalBody) {
        modalBody.innerHTML = content;
    }

    // Get the modal instance (which creates it on the first call) and show it.
    getModal().show();
}

/**
 * Hides the modal from view.
 */
export function closeModal() {
    // Get the modal instance and hide it.
    getModal().hide();
}