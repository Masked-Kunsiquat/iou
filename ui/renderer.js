// ui/renderer.js

import { app } from '../core/state.js';
import { setFabVisibility } from './fab.js';
import { renderTransactionList } from '../features/transactions/transaction-renderer.js';
import { renderPersons } from '../features/persons/person-renderer.js';
import { renderStats } from '../features/stats/stats-renderer.js';

/**
 * Renders the main content based on the current view in the app state.
 */
export function render() {
    switch (app.currentView) {
        case 'iou':
            renderTransactionList('IOU');
            setFabVisibility(true);
            break;
        case 'uom':
            renderTransactionList('UOM');
            setFabVisibility(true);
            break;
        case 'stats':
            renderStats();
            setFabVisibility(false);
            break;
        case 'persons':
            renderPersons();
            setFabVisibility(true);
            break;
        default:
            renderTransactionList('IOU');
    }
}