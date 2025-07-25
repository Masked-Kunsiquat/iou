<script>
	import { Modal, Input, Button } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	let { show = $bindable(false), person = {} } = $props();

	const dispatch = createEventDispatcher();

	let formData = $state({
		id: person?.id || null,
		name: person?.name || '',
		phone: person?.phone || ''
	});

	/**
	 * @param {SubmitEvent} event
	 */
	function handleSubmit(event) {
		event.preventDefault(); // Manually prevent form submission
		dispatch('save', formData);
		closeModal();
	}

	function closeModal() {
		show = false;
	}

	// When the person prop changes (i.e., when opening the modal to edit),
	// update the form data.
	$effect(() => {
		formData = {
			id: person?.id || null,
			name: person?.name || '',
			phone: person?.phone || ''
		};
	});
</script>

<Modal title={formData.id ? 'Edit Person' : 'Add New Person'} bind:open={show} autoclose>
	<form onsubmit={handleSubmit}>
		<div class="space-y-6">
			<div>
				<label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
					Name
				</label>
				<Input
					id="name"
					type="text"
					placeholder="Enter person's name"
					required
					bind:value={formData.name}
				/>
			</div>
			<div>
				<label
					for="phone"
					class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>
					Phone Number (Optional)
				</label>
				<Input
					id="phone"
					type="tel"
					placeholder="Enter phone number"
					bind:value={formData.phone}
				/>
			</div>
		</div>

		<div class="flex justify-end space-x-2 mt-6">
			<Button color="alternative" onclick={closeModal}>Cancel</Button>
			<Button type="submit">Save</Button>
		</div>
	</form>
</Modal>