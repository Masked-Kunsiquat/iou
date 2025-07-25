<script>
	import { Button } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import PersonList from '$lib/components/PersonList.svelte';
	import PersonModal from '$lib/components/PersonModal.svelte';

	let showPersonModal = $state(false);

	function handleAddPerson() {
		showPersonModal = true;
	}

	/**
	 * @param {{id: string|null, name: string, phone: string}} personData
	 */
	function handleSavePerson(personData) {
		console.log('Save callback received!', personData);
		// Database logic will be added here in the next step.
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Dashboard</h1>
	<p>Welcome to your IOU Tracker. Here is a list of all people.</p>
	<hr class="dark:border-gray-700" />
	<PersonList />
</div>

<Button
	onclick={handleAddPerson}
	class="fixed bottom-5 end-5 rounded-full shadow-lg"
	size="xl"
	pill
>
	<PlusOutline class="w-6 h-6" />
</Button>

<PersonModal bind:show={showPersonModal} onSave={handleSavePerson} />