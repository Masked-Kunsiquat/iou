<script>
  import { onMount } from 'svelte';
  import { persons, transactions } from './lib/stores.js';
  import { db } from './lib/db.js';
  import './app.css'; // Import global CSS directly in the script section

  onMount(async () => {
    await db.init();
    
    const personData = await db.getAll('persons');
    const transactionData = await db.getAll('transactions');

    persons.set(personData);
    transactions.set(transactionData);
    
    console.log('Database initialized and data loaded!');
  });

</script>

<div class="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
  
  <header class="bg-blue-700 text-white shadow-md">
    <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
      <h1 class="text-xl font-bold">IOU Tracker</h1>
      <button 
        aria-label="Open menu"
        class="p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m4 6h16"></path></svg>
      </button>
    </nav>
  </header>

  <main class="flex-grow container mx-auto p-4">
    <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">People</h2>
    
    <div class="bg-white rounded-lg shadow-md p-4">
      <p>Person list will go here...</p>
    </div>

  </main>

  <footer class="bg-gray-200 dark:bg-gray-800 text-center p-4">
    <a href="https://github.com/Masked-Kunsiquat/iou" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 dark:text-gray-400 hover:underline">
      View Source on GitHub
    </a>
  </footer>
</div>