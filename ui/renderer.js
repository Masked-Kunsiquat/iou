// ui/renderer.js

import { getState } from '../core/state.js';
import { VIEWS } from '../core/constants.js';
import { setFabVisibility } from './fab.js';
import { renderTransactionList } from '../features/transactions/transaction-renderer.js';
import { renderPersons } from '../features/persons/person-renderer.js';
import { renderStats } from '../features/stats/stats-renderer.js';

/**
 * Renders the main content based on the current view in the app state.
 * Includes error handling for each view's render function to prevent crashes.
 */
export function render() {
    const { currentView } = getState();
    switch (currentView) {
        case VIEWS.IOU:
            try {
                renderTransactionList('IOU');
                setFabVisibility(true);
            } catch (error) {
                console.error('Failed to render IOU view:', error);
            }
            break;
        case VIEWS.UOM:
            try {
                renderTransactionList('UOM');
                setFabVisibility(true);
            } catch (error) {
                console.error('Failed to render UOM view:', error);
            }
            break;
        case VIEWS.STATS:
            try {
                renderStats();
                setFabVisibility(false);
            } catch (error) {
                console.error('Failed to render Stats view:', error);
            }
            break;
        case VIEWS.PERSONS:
            try {
                renderPersons();
                setFabVisibility(true);
            } catch (error) {
                console.error('Failed to render Persons view:', error);
            }
            break;
        default:
            try {
                // Fallback to IOU view for any unknown route
                renderTransactionList('IOU');
                setFabVisibility(true);
            } catch (error) {
                console.error('Failed to render default IOU view:', error);
            }
            break;
    }
}