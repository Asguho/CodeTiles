<script lang="ts">
	import { BASE_URL } from '$lib/utils';

	interface TopPlayersResponse {
		user: {
			id: string;
			projectId: string;
			projectName: string;
			username: string;
			passwordHash: string;
			elo: number;
		};
		rank: string;
		leaderboard: {
			id: string;
			username: string;
			elo: number;
		}[];
	}

	async function fetchTopPlayers(): Promise<TopPlayersResponse> {
		const response = await fetch(`${BASE_URL}/api/stats`, {
			credentials: 'include'
		});
		if (!response.ok) {
			throw new Error('Failed to fetch top players');
		}
		const data = await response.json();
		return data;
	}

	let topPlayers = $state<TopPlayersResponse | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);
	/* $effect(() => {
    fetchTopPlayers()
      .then((data) => {
        topPlayers = data;
      })
      .catch((err) => {
        error = err.message;
      })
      .finally(() => {
        loading = false;
      });
  }); */
</script>

<div class="min-h-screen w-full bg-stone-950">
	<a class="text-white" href="/">Back</a>
	<div
		class="container mx-auto mt-4 mt-6 w-full rounded-2xl border-2 border-stone-600 p-2 text-white"
	>
		<h1 class="text-3xl text-amber-400">Your Leaderboard</h1>
		{#await fetchTopPlayers()}
			<!-- promise is pending -->
			<p>Loading...</p>
		{:then value}
			<!-- promise was fulfilled -->
			<div class="flex flex-col gap-4">
				{#if value}
					<div class="mb-4">
						<p class="text-stone-400">
							Your rank: <span class="font-semibold text-white">{value.rank}</span>
						</p>
					</div>
					<div class="overflow-hidden rounded-lg border border-stone-700">
						<table class="my-0 w-full border-collapse">
							<thead class="bg-stone-800">
								<tr>
									<th class="px-4 py-3 text-left">Rank</th>
									<th class="px-4 py-3 text-left">Player</th>
									<th class="px-4 py-3 text-right">ELO</th>
								</tr>
							</thead>
							<tbody>
								{#each value.leaderboard as player, i}
									<tr
										class={player.username === value.user.username
											? 'bg-amber-900/30'
											: i % 2 === 0
												? 'bg-stone-900'
												: 'bg-stone-950'}
									>
										<td class="px-4 py-3 font-mono">{i + 1}</td>
										<td class="px-4 py-3 font-medium">{player.username}</td>
										<td class="px-4 py-3 text-right font-mono font-semibold">{player.elo}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="italic text-stone-400">No players found.</p>
				{/if}
			</div>
		{:catch error}
			<!-- promise was rejected -->
			<p class="text-red-500">Error: {error}</p>
		{/await}
	</div>
</div>
