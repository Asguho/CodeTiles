<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';

	const { tutorialJson } = $props();

	let goals: { name: string; completed: boolean; id: string; tutorial: string }[] = $state([]);
	$effect(() => {
		if (tutorialJson && tutorialJson.goals) {
			goals = tutorialJson.goals.map(
				(goal: { name: string; completed: boolean; id: number; tutorial: string }) => {
					return {
						name: goal.name,
						completed: goal.completed,
						tutorial: goal.tutorial,
						id: goal.id
					};
				}
			);
		}
	});
	//show goals always in the order of the goals array but only show the next uncompleted goal
	//eg.
	//if goal 1 is completed, show goal 1,2
	//if goal 1 and 2 are completed, show goal 1,2,3
	let goalsToShow: typeof goals = $state([]);

	$effect(() => {
		/* const completedGoals = goals.filter((goal) => goal.completed); */
		const nextUncompletedGoal = goals.find((goal) => !goal.completed);
		if (nextUncompletedGoal) {
			goalsToShow = goals.slice(0, goals.indexOf(nextUncompletedGoal) + 1);
		} else {
			goalsToShow = goals;
		}
	});
</script>

<div class="flex h-fit w-full flex-col items-start justify-start">
	<!-- <div class="flex flex-row items-center justify-start gap-2">
		<span class="flex size-6 items-center justify-center rounded-full bg-red-500"> X </span>
		<span> 1. Goal Name </span>
	</div> -->

	<!-- <span class="h-6 w-3 border-r-[1px] border-stone-500"> </span> -->
	{#each goalsToShow as goal, i}
		<div class="flex flex-row items-center justify-start gap-2">
			{#if goal.completed}
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide stroke-green-500 lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
			{:else}
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide stroke-red-500 lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			{/if}
			<span>{i + 1}. {goal.name}</span>
		</div>
		{#if i == goalsToShow.length - 1}
			<div
				class="prose prose-invert prose-stone mt-4 w-full rounded-2xl border-2 border-stone-600 bg-stone-800 p-4"
			>
				<h2 class="text-2xl font-bold">Tutorial</h2>
				<SvelteMarkdown source={goal.tutorial} />
			</div>
		{/if}
		{#if i < goalsToShow.length - 1}
			<span class="h-6 w-3 border-r-2 border-stone-600"></span>
		{/if}
	{:else}
		<p class="text-red-500">Run game to load tasks!!</p>
	{/each}
</div>
