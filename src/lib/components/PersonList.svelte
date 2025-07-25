<script lang="ts"> // Add lang="ts" to enable TypeScript in the script block
	import { List, Li, Button } from 'flowbite-svelte';
	import { UserEditSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import { db } from '$lib/db.js';
	import { persons, transactions } from '$lib/stores.js';

	// Define an interface for the component's props
	interface PersonListProps {
		onEdit: (person: any) => void;
	}

	// Use the interface with $props()
	const { onEdit }: PersonListProps = $props();

	/**
	 * Handles deleting a person after checking for dependencies.
	 * @param {string} personId - The ID of the person to delete.
	 */
	async function handleDelete(personId: string) { // Explicitly type personId
		const hasTransactions = $transactions.some((t) => t.personId === personId); //
		if (hasTransactions) { //
			alert('Cannot delete person with existing transactions. Please delete their transactions first.'); //
			return; //
		}

		if (confirm('Are you sure you want to delete this person?')) {
			try {
				await db.delete('persons', personId); //
				persons.update((p) => p.filter((person) => person.id !== personId)); //
			} catch (e) {
				console.error('Failed to delete person:', e); //
				alert('There was an error deleting the person.'); //
			}
		}
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
							<Button size="sm" onclick={() => onEdit(person)}>
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