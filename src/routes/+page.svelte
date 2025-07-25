<script>
	import PersonList from '$lib/components/PersonList.svelte';
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Dashboard</h1>
	<p>Welcome to your IOU Tracker. Here is a list of all people.</p>
	<hr class="dark:border-gray-700" />
	<PersonList />
</div>