// ui/renderer.js

import { app } from '../core/state.js';
import { VIEWS } from '../core/constants.js';
import { setFabVisibility } from './fab.js';
import { renderTransactionList } from '../features/transactions/transaction-renderer.js';
import { renderPersons } from '../features/persons/person-renderer.js';
import { renderStats } from '../features/stats/stats-renderer.js';

/**
 * Renders the main content based on the current view in the app state.
 */
export function render() {
    switch (app.currentView) {
        case VIEWS.IOU:
            renderTransactionList('IOU');
            setFabVisibility(true);
            break;
        case VIEWS.UOM:
            renderTransactionList('UOM');
            setFabVisibility(true);
            break;
        case VIEWS.STATS:
            renderStats();
            setFabVisibility(false);
            break;
        case VIEWS.PERSONS:
            renderPersons();
            setFabVisibility(true);
            break;
        default:
            renderTransactionList('IOU');
    }
}