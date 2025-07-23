/**
 * @file Manages app navigation, routing, and the side menu.
 */

let app;

/**
 * Initializes navigation features and event listeners.
 * @param {object} mainApp - The main application object.
 */
export function initNavigation(mainApp) {
  app = mainApp;

  // Menu button
  document.getElementById('menuBtn').addEventListener('click', toggleMenu);
  
  // All navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Listen for URL hash changes to route
  window.addEventListener('hashchange', router);

  // Initial route check
  router();
}

/**
 * Toggles the visibility of the navigation menu.
 * @param {boolean} [show] - Force show/hide. If undefined, it toggles.
 */
function toggleMenu(show) {
  const nav = document.getElementById('nav');
  if (show === undefined) {
    nav.classList.toggle('hidden');
  } else {
    nav.classList.toggle('hidden', !show);
  }
}

/**
 * Reads the URL hash and triggers a render for the corresponding view.
 */
function router() {
  // Get the view name from the hash, defaulting to 'iou'
  const hash = window.location.hash.slice(1) || 'iou';
  app.currentView = hash;
  
  // Tell the main app to render the new view
  app.render();
}