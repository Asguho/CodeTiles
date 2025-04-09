<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import CodeBlockRenderer from '$lib/CodeBlockRenderer.svelte';
	import { fade } from 'svelte/transition';

	const { tutorialJson = $bindable(), md } = $props();

	const firstTask = (isDone: boolean) => {
		return {
			tutorial: md,
			name: 'Run the game',
			completed: isDone,
			isTutorialOpen: !isDone,
			id: '0'
		};
	};

	let goals: {
		name: string;
		completed: boolean;
		id: string;
		tutorial: string;
		isTutorialOpen: boolean;
	}[] = $state([firstTask(false)]);

	$effect(() => {
		if (tutorialJson && tutorialJson.goals) {
			goals = [
				firstTask(true),
				...tutorialJson.goals.map(
					(goal: { name: string; completed: boolean; id: number; tutorial: string }) => {
						return {
							name: goal.name,
							completed: goal.completed,
							tutorial: goal.tutorial,
							isTutorialOpen: !goal.completed,
							id: goal.id
						};
					}
				)
			];
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
	{#each goalsToShow as goal, i (goal.name)}
		<div in:fade>
			<div class="flex flex-row items-center justify-start gap-2">
				{#if goal.completed}
					<!-- prettier-ignore -->
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide stroke-green-500 lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
				{:else}
					<!-- prettier-ignore -->
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide stroke-red-500 lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				{/if}
				<span>{i + 1}. {goal.name}</span>
				<button
					class="ml-auto rounded-full bg-stone-600 px-2 py-1 text-sm font-bold text-stone-200 opacity-70 hover:bg-stone-500"
					onclick={() => (goal.isTutorialOpen = !goal.isTutorialOpen)}
				>
					{goal.isTutorialOpen ? 'Hide' : 'Show'}
				</button>
			</div>
			{#if goal.isTutorialOpen}
				<div
					class="prose prose-invert prose-stone ml-[10px] mt-4 w-full rounded-2xl rounded-l-none border-0 border-l-2 border-stone-600 p-2"
				>
					<SvelteMarkdown renderers={{ code: CodeBlockRenderer }} source={goal.tutorial} />
				</div>
			{/if}
			{#if i < goalsToShow.length - 1}
				<span class="h-6 w-3 border-r-2 border-stone-600"></span>
			{/if}
		</div>
	{/each}
</div>
