// core/state.js

// Make key functions available to modules that need them
// We will define these later, but the state object needs placeholders
function render() {}
function showPersonModal() {}
function showTransactionModal() {}


// Global app state
export const app = {
    version: '1.0.2',
    persons: [],
    transactions: [],
    currentView: 'iou',
    currentTransaction: null,
    chart: null,
    render,
    showPersonModal,
    showTransactionModal,
};