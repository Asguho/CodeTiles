<script lang="ts">
	const tasks = [
		{ id: 1, name: 'Buy a miner unit', completed: false },
		{ id: 2, name: 'Move a unit', completed: false },
		{ id: 3, name: 'Find nearest ore', completed: false },
		{ id: 4, name: 'Go to ore position', completed: false },
		{ id: 5, name: 'Mine ore', completed: false },
		{ id: 6, name: 'console.log a message', completed: false },
		{ id: 7, name: 'Buy a melee unit', completed: false },
		{ id: 8, name: 'Find enemy', completed: false },
		{ id: 9, name: 'Go to enemy position', completed: false },
		{ id: 10, name: 'Attack enemy', completed: false }
	];

	function toggleTaskCompletion(taskId: number) {
		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			task.completed = !task.completed;
		}
	}

	//show tasks always in the order of the tasks array but only show the next uncompleted task
	//eg.
	//if task 1 is completed, show task 1,2
	//if task 1 and 2 are completed, show task 1,2,3
	let tasksToShow: typeof tasks = $state([]);

	$effect(() => {
		const completedTasks = tasks.filter((task) => task.completed);
		const nextUncompletedTask = tasks.find((task) => !task.completed);
		if (nextUncompletedTask) {
			tasksToShow = tasks.slice(0, tasks.indexOf(nextUncompletedTask) + 1);
		} else {
			tasksToShow = tasks;
		}
	});
</script>

<div class="flex h-96 w-full flex-col items-start justify-start">
	<!-- <div class="flex flex-row items-center justify-start gap-2">
		<span class="flex size-6 items-center justify-center rounded-full bg-red-500"> X </span>
		<span> 1. Task Name </span>
	</div> -->

	<!-- <span class="h-6 w-3 border-r-[1px] border-stone-500"> </span> -->
	{#each tasksToShow as task, i}
		<div class="flex flex-row items-center justify-start gap-2">
			<span class="flex size-6 items-center justify-center rounded-full border-2 border-stone-600">
				{task.completed ? '✓' : 'X'}
			</span>
			<span>{i + 1}. {task.name}</span>
		</div>
		{#if i < tasksToShow.length - 1}
			<span class="h-6 w-3 border-r-2 border-stone-600"></span>
		{/if}
	{/each}
</div>
