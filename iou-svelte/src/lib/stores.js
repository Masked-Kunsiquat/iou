// src/lib/stores.js
import { writable } from 'svelte/store';

// The 'writable' function creates a store that can be written to from anywhere.
// This will hold all of our application's people and transactions.
export const persons = writable([]);
export const transactions = writable([]);

// We can add more stores here as we need them (e.g., for the current view).