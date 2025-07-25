<script>
	import { persons, transactions } from '$lib/stores.js';
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Welcome to IOU Tracker</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit" class="text-primary-500 hover:underline">
			svelte.dev/docs/kit
		</a> to read the documentation.
	</p>

	<div class="p-4 border rounded-lg bg-white dark:bg-gray-800">
		<h2 class="text-lg font-semibold">Data Loading Status</h2>
		<p>Persons loaded: {$persons.length}</p>
		<p>Transactions loaded: {$transactions.length}</p>
	</div>
</div>