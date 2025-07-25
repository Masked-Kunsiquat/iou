// app.js

import { init } from './core/main.js';

// Wait for the DOM to be fully loaded before initializing the app.
// This ensures that all scripts, including the Flowbite CDN script,
// are available before our code tries to use them.
document.addEventListener('DOMContentLoaded', init);