<script>
	import { Button } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import PersonList from '$lib/components/PersonList.svelte';
	import PersonModal from '$lib/components/PersonModal.svelte';
	import { db } from '$lib/db.js';
	import { persons } from '$lib/stores.js';
	import { validatePerson, normalizePhoneNumber } from '$lib/utils/personUtils.js';

	let showPersonModal = $state(false);
	/** @type {any | null} */
	let selectedPerson = $state(null); // To hold the person being edited

	function handleAddPerson() {
		selectedPerson = {}; // Clear selected person for a new entry
		showPersonModal = true;
	}

	/**
	 * @param {any} person
	 */
	function handleEditPerson(person) {
		selectedPerson = person;
		showPersonModal = true;
	}

	/**
	 * @param {{id: string|null, name: string, phone: string}} personData
	 */
	async function handleSavePerson(personData) {
		const validation = validatePerson(personData, $persons, personData.id);

		if (!validation.isValid) {
			alert(validation.error); // Using browser alert for now
			return;
		}

		try {
			const id = personData.id || crypto.randomUUID();
			const personToSave = {
				id,
				name: personData.name.trim(),
				phone: normalizePhoneNumber(personData.phone)
			};

			await db.put('persons', personToSave);

			// Update the Svelte store to trigger UI refresh
			if (personData.id) {
				persons.update((p) => p.map((p) => (p.id === id ? personToSave : p)));
			} else {
				persons.update((p) => [...p, personToSave]);
			}
		} catch (e) {
			console.error('Failed to save person:', e);
			alert('There was an error saving the person.');
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Dashboard</h1>
	<p>Welcome to your IOU Tracker. Here is a list of all people.</p>
	<hr class="dark:border-gray-700" />
	<PersonList onEdit={handleEditPerson} />
</div>

<Button
	onclick={handleAddPerson}
	class="fixed bottom-5 end-5 rounded-full shadow-lg"
	size="xl"
	pill
>
	<PlusOutline class="w-6 h-6" />
</Button>

<PersonModal bind:show={showPersonModal} person={selectedPerson} onSave={handleSavePerson} />