<script>
  import { persons } from '../stores.js';
  import { Button } from 'flowbite-svelte';
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {#each $persons as person (person.id)}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col justify-between">
      <div>
        <h3 class="font-semibold text-lg text-gray-900 dark:text-white">{person.name}</h3>
        <p class="text-gray-600 dark:text-gray-400">{person.phone}</p>
      </div>
      <div class="flex gap-2 mt-4">
        <Button size="sm">Edit</Button>
        <Button size="sm" color="red">Delete</Button>
      </div>
    </div>
  {:else}
    <p class="text-gray-500 dark:text-gray-400">No people found. Add one to get started!</p>
  {/each}
</div>