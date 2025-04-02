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

<div class="flex h-96 w-full flex-col items-start justify-start">
	<!-- <div class="flex flex-row items-center justify-start gap-2">
		<span class="flex size-6 items-center justify-center rounded-full bg-red-500"> X </span>
		<span> 1. Goal Name </span>
	</div> -->

	<!-- <span class="h-6 w-3 border-r-[1px] border-stone-500"> </span> -->
	{#each goalsToShow as goal, i}
		<div class="flex flex-row items-center justify-start gap-2">
			<span class="flex size-6 items-center justify-center rounded-full border-2 border-stone-600">
				{goal.completed ? '✓' : 'X'}
			</span>
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
	{/each}
</div>
