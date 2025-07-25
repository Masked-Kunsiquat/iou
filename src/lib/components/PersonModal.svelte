<script>
	import { Modal, Input, Button } from 'flowbite-svelte';

	// The `onSave` prop is now a function passed by the parent.
	let {
		show = $bindable(false),
		person = {},
		onSave = (/** @type {{id: string|null, name: string, phone: string}} */ data) => {}
	} = $props();

	let formData = $state({
		id: person?.id || null,
		name: person?.name || '',
		phone: person?.phone || ''
	});

	/**
	 * @param {SubmitEvent} event
	 */
	function handleSubmit(event) {
		event.preventDefault();
		onSave(formData); // Call the onSave prop directly
		closeModal();
	}

	function closeModal() {
		show = false;
	}

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