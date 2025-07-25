<script>
  import { Button, Input, Label, Modal, Helper } from 'flowbite-svelte';

  export let open = false;
  export let person = { id: null, name: '', phone: '' };
  /**
   * Callback function to be executed when saving.
   * @type {(personData: {id: string|null, name: string, phone: string}) => void}
   */
  export let onSave = () => {};

  function handleSubmit() {
    onSave(person);
    handleClose();
  }

  function handleClose() {
    open = false;
    person = { id: null, name: '', phone: '' };
  }
</script>

<Modal bind:open title={person.id ? 'Edit Person' : 'Add Person'} onclose={handleClose}>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="space-y-6">
      <div>
        <Label for="name" class="mb-2 block">Full Name</Label>
        <Input type="text" id="name" placeholder="John Doe" bind:value={person.name} required />
      </div>
      <div>
        <Label for="phone" class="mb-2 block">Phone Number</Label>
        <Input type="tel" id="phone" placeholder="(123) 456-7890" bind:value={person.phone} />
        <Helper class="mt-2 text-sm">Optional, used for reference.</Helper>
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-6">
      <Button type="button" color="light" onclick={handleClose}>Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</Modal>