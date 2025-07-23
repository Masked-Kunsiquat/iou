// core/main.js

import { db } from '../db.js';
import { getState, setState, subscribe } from './state.js';

// Import UI Modules
import { initModal } from '../ui/modal.js';
import { initFab } from '../ui/fab.js';
import { initNavigation } from '../ui/navigation.js';
import { showConfirm } from '../ui/notifications.js';
import { render } from '../ui/renderer.js';

// Import Feature Modules
import { initActions } from '../features/actions.js';
import { initPersonModals } from '../features/persons/person-modals.js';
import { initTransactionModals } from '../features/transactions/transaction-modals.js';
import { exportData, handleImport } from '../features/import-export/data-service.js';


// =================================================================================================
// INITIALIZATION
// =================================================================================================

/**
 * Initializes the application, loads data, and sets up UI modules.
 */
export async function init() {
    try {
        await db.init();
        
        // Subscribe the render function to state changes.
        // Any time setState is called, render will be executed.
        subscribe(render);

        await loadData();

        // Initialize feature modules, passing the loadData function
        const deps = { loadData };
        initActions(deps);
        initPersonModals(deps);
        initTransactionModals(deps);


        // Initialize UI modules
        initModal();
        initFab();
        initNavigation();

        setupEventListeners();
        registerServiceWorker();

        const versionBadge = document.getElementById('versionBadge');
        if (versionBadge) {
            versionBadge.textContent = `v${getState().version}`;
        }

        const githubLink = document.querySelector('.github-link');
        if (githubLink) {
            githubLink.href = `https://github.com/Masked-Kunsiquat/iou/tree/v${getState().version}`;
        }
        
        // Initial render is handled by the navigation router (ui/navigation.js),
        // which sets the initial view and triggers the first render.
    } catch (error) {
        console.error("Failed to initialize the app:", error);
        // Optionally, display an error message to the user
        const mainElement = document.getElementById('main');
        if (mainElement) {
            mainElement.innerHTML = `<div class="card"><div class="card-header"><h2>Error</h2></div><div class="card-body"><p>Could not initialize the application. Please try refreshing the page.</p></div></div>`;
        }
    }
}

/**
 * Loads all persons and transactions from the database into the app state.
 */
export async function loadData() {
    const persons = await db.getAll('persons');
    const transactions = await db.getAll('transactions');
    setState({ persons, transactions });
}

/**
 * Sets up event listeners that are not handled by the individual UI modules.
 */
function setupEventListeners() {
    // Import/Export functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        // Pass loadData directly, render will be triggered by setState within loadData.
        importBtn.addEventListener('change', (e) => handleImport(e, loadData));
    }
}

// =================================================================================================
// SERVICE WORKER
// =================================================================================================

/**
 * Registers the service worker and handles update notifications.
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('Service Worker registered');

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                        if (showConfirm('New version available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    }
}