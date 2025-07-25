/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}', // Add this line
  ],

  theme: {
    extend: {},
  },

  plugins: [
    require('flowbite/plugin'), // Add this line
  ],
};