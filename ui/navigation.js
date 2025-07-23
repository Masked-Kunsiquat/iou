/**
 * @file Manages app navigation, routing, and the side menu.
 */

import { VIEWS } from '../core/constants.js';

let app;
let isInitialized = false;

/**
 * Initializes navigation features and event listeners.
 * Includes guards to prevent multiple initializations and null checks for DOM elements.
 * @param {object} mainApp - The main application object.
 */
export function initNavigation(mainApp) {
  if (isInitialized) return;

  app = mainApp;

  // Menu button
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => toggleMenu());
  } else {
    console.warn('Menu button with id "menuBtn" not found.');
  }
  
  // All navigation links
  const navLinks = document.querySelectorAll('.nav-link');
  if (navLinks.length > 0) {
    navLinks.forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  } else {
    console.warn('Elements with class "nav-link" not found.');
  }

  // Listen for URL hash changes to route
  window.addEventListener('hashchange', router);

  // Initial route check
  router();

  isInitialized = true;
}

/**
 * Toggles the visibility of the navigation menu.
 * @param {boolean} [show] - Force show/hide. If undefined, it toggles.
 */
function toggleMenu(show) {
  const nav = document.getElementById('nav');
  if (!nav) {
    console.warn('Navigation element with id "nav" not found.');
    return;
  }

  if (show === undefined) {
    nav.classList.toggle('hidden');
  } else {
    nav.classList.toggle('hidden', !show);
  }
}

/**
 * Reads the URL hash and triggers a render for the corresponding view.
 * Validates the route and handles potential rendering errors.
 */
function router() {
  if (!app) {
      console.error("Router called before app is initialized.");
      return;
  }

  // Get the view name from the hash, defaulting to 'iou'
  let hash = window.location.hash.slice(1);

  // Validate the hash; if invalid, default to the IOU view
  if (!Object.values(VIEWS).includes(hash)) {
      hash = VIEWS.IOU;
      // Update the URL to reflect the default view, preventing invalid states in history
      window.location.hash = hash;
      return; // The hash change will trigger the router again with a valid hash
  }

  app.currentView = hash;
  
  // Tell the main app to render the new view
  try {
    app.render();
  } catch (error) {
    console.error(`Error rendering view "${hash}":`, error);
  }
}