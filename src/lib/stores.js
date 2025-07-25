import { writable } from 'svelte/store';

/**
 * @file This module defines and exports Svelte stores for managing the
 * application's reactive state.
 */

/**
 * A writable Svelte store to hold the list of all persons.
 * @type {import('svelte/store').Writable<any[]>}
 */
export const persons = writable([]);

/**
 * A writable Svelte store to hold the list of all transactions.
 * @type {import('svelte/store').Writable<any[]>}
 */
export const transactions = writable([]);