<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { db } from '$lib/db.js';
	import { persons, transactions } from '$lib/stores.js';

	let { children } = $props();

	let isLoading = $state(true);
	/** @type {string | null} */
	let error = $state(null);

	onMount(async () => {
		try {
			await db.init();
			console.log('Database initialized successfully.');

			const [personsData, transactionsData] = await Promise.all([
				db.getAll('persons'),
				db.getAll('transactions')
			]);

			persons.set(personsData);
			transactions.set(transactionsData);

			console.log('Data loaded into stores:', {
				persons: personsData,
				transactions: transactionsData
			});
		} catch (e) {
			console.error('Failed to initialize database or load data:', e);
			if (e instanceof Error) {
				error = e.message;
			} else {
				error = 'An unknown error occurred.';
			}
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
	<header class="bg-primary-500 text-white p-4 shadow-md">
		<h1 class="text-xl font-bold">IOU Tracker</h1>
	</header>

	<main class="p-4">
		{#if isLoading}
			<p>Loading...</p>
		{:else if error}
			<p class="text-red-500">Error: {error}</p>
		{:else}
			{@render children()}
		{/if}
	</main>

	<footer class="text-center p-4 text-gray-500 text-sm">
		<p>IOU Tracker &copy; 2025</p>
	</footer>
</div>