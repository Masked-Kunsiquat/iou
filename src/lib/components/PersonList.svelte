<script>
	import { List, Li, Button } from 'flowbite-svelte';
	import { UserEditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import { persons } from '$lib/stores.js';

	/**
	 * Handles the edit action for a person.
	 * @param {any} personId - The ID of the person to edit.
	 */
	function handleEdit(personId) {
		console.log('Editing person:', personId);
		alert(`Editing person ID: ${personId}`);
	}

	/**
	 * Handles the delete action for a person.
	 * @param {any} personId - The ID of the person to delete.
	 */
	function handleDelete(personId) {
		console.log('Deleting person:', personId);
		alert(`Deleting person ID: ${personId}`);
	}
</script>

<div>
	<h2 class="text-2xl font-semibold mb-4">People</h2>
	{#if $persons.length > 0}
		<List class="divide-y divide-gray-200 dark:divide-gray-700">
			{#each $persons as person (person.id)}
				<Li class="py-3 sm:py-4">
					<div class="flex items-center space-x-4 rtl:space-x-reverse">
						<div class="flex-shrink-0">
							<div
								class="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center font-bold text-primary-800 dark:text-primary-100"
							>
								{person.name.charAt(0).toUpperCase()}
							</div>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate dark:text-white">
								{person.name}
							</p>
							<p class="text-sm text-gray-500 truncate dark:text-gray-400">
								{person.phone || 'No phone number'}
							</p>
						</div>
						<div class="inline-flex items-center space-x-2">
							<Button size="sm" onclick={() => handleEdit(person.id)}>
								<UserEditSolid class="w-4 h-4 me-1" />
								Edit
							</Button>
							<Button color="red" size="sm" onclick={() => handleDelete(person.id)}>
								<TrashBinSolid class="w-4 h-4 me-1" />
								Delete
							</Button>
						</div>
					</div>
				</Li>
			{/each}
		</List>
	{:else}
		<p class="text-gray-500 dark:text-gray-400">No people found. Add one to get started!</p>
	{/if}
</div>