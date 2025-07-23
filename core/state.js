// core/state.js

/**
 * @file Manages the application's global state with immutable updates and an observer pattern.
 */

// The single source of truth for the application state.
// It's not exported, so it can only be modified through the exported functions.
const _state = {
    version: '1.0.3',
    persons: [],
    transactions: [],
    currentView: 'iou',
    chart: null,
    // Add new state for sorting and filtering
    transactionSort: {
        by: 'date', // 'date', 'name'
        order: 'desc' // 'asc', 'desc'
    },
    showPaid: false,
};

// A list of listener functions to be called when the state changes.
const _listeners = new Set();

/**
 * Subscribes a listener function to state changes.
 * The listener will be called whenever the state is updated.
 *
 * @param {Function} listener - The function to call on state changes.
 * @returns {Function} A function to unsubscribe the listener.
 */
export function subscribe(listener) {
    _listeners.add(listener);
    // Return an unsubscribe function
    return () => _listeners.delete(listener);
}

/**
 * Notifies all subscribed listeners that the state has changed.
 * This is called internally after every state update.
 */
function _notify() {
    for (const listener of _listeners) {
        listener();
    }
}

/**
 * Returns a deep copy of the current state.
 * This prevents direct mutation of the state object.
 *
 * @returns {object} The current application state.
 */
export function getState() {
    // Using structuredClone for a deep copy to handle nested objects and arrays
    return structuredClone(_state);
}

/**
 * Updates the state by merging the current state with a new partial state object.
 * This is the only way to modify the state. It ensures that every change
 * goes through a single point and notifies listeners.
 *
 * @param {object} partialState - An object containing the state properties to update.
 */
export function setState(partialState) {
    // Merge the new partial state into the current state
    Object.assign(_state, partialState);
    _notify(); // Notify all listeners about the change
}