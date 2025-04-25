<script lang="ts">
	import {
		addTurnDivider,
		clearConsole,
		ingestLogs,
		setupConsole,
		getAmountOfLines,
		addConsoleLine
	} from '$lib/Console';
	import { setupEditor, getMarkers } from '$lib/Editor';
	import { setupGameCanvas, drawGame } from '$lib/GameCanvas';
	import { BASE_URL } from '$lib/utils';
	import { editor } from 'monaco-editor';
	import { PaneGroup, Pane, PaneResizer, type PaneAPI } from 'paneforge';
	import { onMount } from 'svelte';
	import { Tabs } from 'bits-ui';

	import type { TurnData, TurnDataWithLogs } from '../../../server/src/types.js';
	import TaskRenderer from './task-renderer.svelte';

	let websocketHasClosed = $state(false);

	let gameCanvas: HTMLCanvasElement;
	let latestGameData: any = null;
	let gameOver = $state(false);
    let lastWinner = $state('');
	let opponentName = $state('');

	let runningGame = $state(false);
	$inspect(runningGame);

	console.log('Hello, Vite!', document);

	let codeEditor: editor.IStandaloneCodeEditor | null = null;
	let consoleElement: HTMLDivElement | null = null;
	let lastSavedcode = $state('');

	let consoleTab = $state('console');

	let markers: editor.IMarkerData[] = $state([]);

	//every 1000ms uddate the markers
	const updateMarkers = () => {
		if (!codeEditor) return;
		markers = getMarkers();
	};
	setInterval(updateMarkers, 1000);

	/* $effect(() => {
		if (markers.length > 0) {
			consoleTab = 'errors';
		}
	}); */

	let consoleLines = $state(0);
	//every 1000ms update the console lines
	const updateConsoleLines = () => {
		if (!consoleElement) return;
		const lines = getAmountOfLines();
		consoleLines = lines;
	};

	setInterval(updateConsoleLines, 1000);

	onMount(async () => {
		console.log('Hello, Vite!', document);
		setupGameCanvas(gameCanvas);
		setupConsole(consoleElement!);
		codeEditor = await setupEditor(document.getElementById('editor')!);

		let res = await fetch(BASE_URL + '/api/get_code', {
			method: 'GET',
			credentials: 'include'
		});
		if (res.ok) {
			let { code } = await res.json();
			codeEditor?.setValue(code);
			lastSavedcode = code;
			//if no code is returned, open the tutorial pane
			if (!code) {
				isTutorial = true;
				tutPane?.expand();
			}
		} else {
			console.error('Error fetching code:', res.statusText);
			//open the tutorial pane if no code is returned
			isTutorial = true;
			tutPane?.expand();
		}
	});

	let uploading = $state(false);
	async function uploadCode() {
		uploading = true;
		const code = codeEditor?.getValue();
		if (!code) return;
		lastSavedcode = code;
		const response = await fetch(BASE_URL + '/api/upload_code', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: code
		});
		console.log('Response:', response);
		uploading = false;
	}

	let tutorialJson = $state([]);

	const url = new URL(`/ws`, BASE_URL || location.href);
	url.protocol = url.protocol.replace('http', 'ws');
	let ws = new WebSocket(url.toString());
	ws.onopen = function () {
		console.log('WebSocket is open now on ', url.toString());
	};

	ws.onmessage = function (event: MessageEvent) {
		console.log('WebSocket message received:', event.data);
		try {
			const json = JSON.parse(event.data.toString()) as TurnDataWithLogs;
			if (json?.type === 'TURN_DATA') {
				drawGame(gameCanvas, json);
				if (json.turn !== 1) {
					addTurnDivider(consoleElement!, json.turn - 1);
				}
				latestGameData = json;
				console.log('Game data received:', json.logs);
				ingestLogs(consoleElement!, json.logs);
			} else if (json?.type === 'LOG') {
				ingestLogs(consoleElement!, json.logs);
			} else if (json?.type === 'tutorial_complete' || json?.type === 'tutorial_progress') {
				console.log('Tutorial complete!');
				tutorialJson = json as any;
			} else if (json?.type === 'GAME_OVER') {
				gameOver = true;
				lastWinner = (json as any).winner || 'No winner'; 
				addConsoleLine(consoleElement!, {
					type: 'info',
					values: ['Game over! Winner:', lastWinner,  ' Gameover: ' + gameOver]
				});
				// Handle game over logic here
				runningGame = false;
			} else if (json?.type === 'START'){
				runningGame = true;
				gameOver = false;
				lastWinner = 'No winner';
				opponentName = ((json as any).opponentUsername1 || 'Unknown') + " and " + ((json as any).opponentUsername2 || 'Unknown');
				addConsoleLine(consoleElement!, {
					type: 'info',
					values: ['Game started! Opponent:', opponentName]
				});
			} else if (json?.type === 'GAME_ONGOING'){
				runningGame = true;
				gameOver = false;
				opponentName = ((json as any).opponentUsername1 || 'Unknown') + " and " + ((json as any).opponentUsername2 || 'Unknown');			} else if (json?.type === 'PING') {
				console.log("opponents: " + opponentName);
				console.log("Your user: " + (json as any).YourUsername);
			} else {
				console.log('Unknown message type:', json);
			}
		} catch (error) {
			console.error('WEBSOKET DATA NOT JSON', event.data, error);
		}
	};
	

	ws.onclose = function () {
		console.log('WebSocket is closed now.');
		websocketHasClosed = true;
	};

	$effect(() => {
		fetch(BASE_URL + '/api/auth/validate', {
			method: 'POST',
			credentials: 'include'
		}).then((res) => {
			if (res.status === 401) {
				window.location.href = '/login.html';
			}
		});
	});

	async function handleRun() {
		if (!codeEditor) return;
		const code = codeEditor.getValue();
		if (!code) return;
		clearConsole(consoleElement!);
		if (code !== lastSavedcode) {
			await uploadCode();
			lastSavedcode = code;
		}
		try {
			uploading = true;
			runningGame = true;
			consoleTab = 'console';
			tutorialJson = [];
			await fetch(`${BASE_URL}/api/start_game${isTutorial ? '?tutorial=true' : ''}`, {
				method: 'POST',
				credentials: 'include'
			});
			uploading = false;
		} catch (error) {
			console.error('Error starting game:', error);
			addConsoleLine(consoleElement!, {
				type: 'error',
				values: ['Error starting game. Please try again.', JSON.stringify(error)]
			});
			uploading = false;
		}
	}

	const tutorial = async () => {
		const resp = await fetch('/tut.md');
		const md = await resp.text();
		return md;
	};

	let isTutorial = $state(false);
	let tutPane: PaneAPI | undefined = $state(undefined);
	$effect(() => {
		if (!tutPane) return;
		if (isTutorial) {
			tutPane?.expand();
		} else {
			tutPane?.collapse();
		}
	});
	
</script>

{#if runningGame && !isTutorial} 
    <div class="absolute right-1.5 top-2 z-50 flex h-8 items-center rounded-md bg-zinc-800 px-4 text-base text-zinc-200 shadow-md">
        <span class="text-left whitespace-nowrap">Playing against: {opponentName}</span>
    </div>
{/if}

{#if websocketHasClosed}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-xl">
			<h2 class="mb-3 text-xl font-semibold text-zinc-100">Connection Lost</h2>
			<p class="mb-2 text-zinc-300">WebSocket connection has been closed.</p>
			<p class="mb-4 text-zinc-300">Reload the page to reconnect.</p>
			<button
				class="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				onclick={() => window.location.reload()}
			>
				Reload Page
			</button>
		</div>
	</div>
{/if}
{#if gameOver && !runningGame && !isTutorial}
    <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div class="rounded-lg border border-zinc-700 bg-zinc-800 bg-opacity-90 p-6 shadow-xl text-center pointer-events-auto">
            <h2 class="mb-3 text-2xl font-bold text-zinc-100">Game Over</h2>
            <p class="mb-4 text-lg text-zinc-300">
                {#if lastWinner === 'No winner'}
                    No winner was determined for this game.
                {:else}
                    The winner is <span class="font-semibold text-white">{lastWinner}</span>!
                {/if}
            </p>
            <button
                class="mt-4 w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onclick={() => {
                    gameOver = false;
                }}
            >
                Next
            </button>
        </div>
    </div>
{/if}

<div class="bg-zinc-900 px-1 pt-1">
	<div
		class="flex h-10 flex-row items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-0.5"
	>
		<div
			class="flex flex-row gap-2 *:rounded-md *:border *:border-zinc-700 *:bg-zinc-800 *:p-1 *:px-2 *:text-zinc-200"
		>
		<label for="tutorial" class="flex items-center gap-2 text-sm text-zinc-200">
			<input
				type="checkbox"
				bind:checked={isTutorial}
				id="tutorial"
				class="hidden"
			/>
			<span
				class="flex items-center justify-center w-5 h-5 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
			>
				{#if isTutorial}
					<!-- Checkmark icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-4 h-4 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{:else}
					<!-- Invisible placeholder to maintain size -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-4 h-4 text-transparent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</span>
			<span>Tutorial</span>
		</label>
			<a href="/docs.html">Documentation</a>
			<a href="/top.html">Leaderboard</a>
			<!-- <button
				class=""
				disabled={uploading}
				onclick={() => {
					/* Logic */
				}}>Home</button
			>
			<button
				class=""
				onclick={() => {
					/* Logic */
				}}>File</button
			>
			dropdown -->
			<!-- <button
				class=""
				onclick={() => {
					/* Logic */
				}}>Save</button
			> -->
		</div>
		<div
			class="flex flex-row gap-2 *:rounded-md *:border *:border-zinc-700 *:bg-zinc-800 *:p-1 *:px-2 *:text-zinc-200"
		>
			<!-- <button
				class=""
				onclick={() => {
					uploadCode();
				}}>Save</button
			> -->
			<button
				class="flex h-8 w-20 items-center justify-center gap-3 rounded-md border border-zinc-700 bg-zinc-800 p-1 text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
				disabled={uploading || runningGame}
				onclick={() => {
					handleRun();
				}}
			>
				{#if uploading}
					<!-- loading spinner -->
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-zinc-700 border-t-zinc-200"
					></div>
				{/if}
				RUN
			</button>
		</div>
	</div>
</div>

<div class="h-[calc(100vh-3rem)] w-screen bg-zinc-900 p-1">
	<PaneGroup direction="horizontal" id="main-pane-group">
		<!-- Always include the tutorial pane but hide it when not needed -->
		<Pane
			bind:pane={tutPane}
			defaultSize={30}
			minSize={15}
			collapsedSize={0}
			maxSize={50}
			id="tutorial-pane"
			style={isTutorial ? '' : 'display: none;'}
		>
			{#await tutorial() then md}
				<div
					class="prose prose-invert h-full max-w-full overflow-y-auto rounded-lg border-2 border-zinc-700 bg-zinc-800 p-2 text-zinc-200"
				>
					<TaskRenderer {md} bind:tutorialJson />
				</div>
			{/await}
		</Pane>
		<!-- Always include the resizer but hide it when tutorial is off -->
		<PaneResizer
			id="tutorial-resizer"
			class="relative flex w-2 items-center justify-center bg-zinc-900"
			style={isTutorial ? '' : 'display: none;'}
			onDraggingChange={() => {
				console.log('tutorial pane dragging');
				if (!latestGameData) return;
				drawGame(gameCanvas, latestGameData);
			}}
		>
			<div class="z-10 flex h-7 w-5 items-center justify-center rounded-sm text-zinc-300">
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
			</div>
		</PaneResizer>
		<Pane defaultSize={50} id="editor-pane">
			<div class="flex h-full w-full rounded-lg border-2 border-zinc-700 bg-zinc-900 p-1">
				<div id="editor" class="w-full">Loading editor...</div>
			</div>
		</Pane>
		<PaneResizer
			id="editor-canvas-resizer"
			class="relative flex w-2 items-center justify-center bg-zinc-900"
			onDraggingChange={() => {
				console.log('dragging editor-canvas');
				if (!latestGameData) return;
				drawGame(gameCanvas, latestGameData);
			}}
		>
			<div class="z-10 flex h-7 w-5 items-center justify-center rounded-sm text-zinc-300">
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
			</div>
		</PaneResizer>
		<Pane defaultSize={50} id="right-side-pane">
			<PaneGroup direction="vertical" id="vertical-pane-group">
				<Pane defaultSize={50} id="canvas-pane">
					<div class="flex h-full rounded-lg border border-zinc-700 bg-zinc-800 p-2">
						<canvas bind:this={gameCanvas} class="h-full w-full"></canvas>
					</div>
				</Pane>
				<PaneResizer
					id="canvas-console-resizer"
					class="relative flex h-2 items-center justify-center bg-zinc-900"
					onDraggingChange={() => {
						console.log('dragging canvas-console');
						if (!latestGameData) return;
						drawGame(gameCanvas, latestGameData);
					}}
				>
					<div class="z-10 flex h-5 w-7 items-center justify-center rounded-sm text-zinc-300">
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-horizontal"><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/><circle cx="5" cy="15" r="1"/></svg>
					</div>
				</PaneResizer>
				<Pane defaultSize={50} id="console-pane" class="relative">
					<Tabs.Root
						bind:value={consoleTab}
						class="flex h-full flex-col rounded-lg border border-zinc-700 bg-zinc-800 p-2"
					>
						<Tabs.List class="">
							<Tabs.Trigger
								value="console"
								class="rounded-md rounded-b-none px-4 py-1 text-sm text-zinc-100 data-[state=active]:bg-zinc-950"
							>
								{#if consoleLines > 0}
									Console
									<span
										class="ml-2 rounded-full border-2 border-blue-400 bg-blue-600 px-1 text-xs text-white"
										>{consoleLines}</span
									>
								{:else}
									Console
								{/if}
							</Tabs.Trigger>
							<Tabs.Trigger
								value="errors"
								class="rounded-md rounded-b-none px-4 py-1 text-sm text-zinc-100 data-[state=active]:bg-zinc-950"
							>
								{#if markers.length > 0}
									Errors <span
										class="ml-2 rounded-full border-2 border-red-500 bg-red-400 px-1 text-xs text-black"
										>{markers.length}</span
									>
								{:else}
									Errors
								{/if}
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content
							value="console"
							class="h-full flex-1 rounded-md rounded-tl-none bg-zinc-950"
						>
							<div class="flex h-full text-zinc-200" bind:this={consoleElement}></div>
						</Tabs.Content>
						<Tabs.Content value="errors" class="h-full flex-1">
							<div
								class="left-0 top-0 z-10 h-full w-full overflow-y-scroll rounded-md bg-zinc-950 p-2"
							>
								{#each markers as marker}
									<div
										class={`mb-2 rounded-md border p-2 shadow-sm ${
											marker.severity === 8
												? 'border-red-500 bg-red-950'
												: marker.severity === 4
													? 'border-yellow-500 bg-yellow-950'
													: 'border-blue-500 bg-blue-950'
										}`}
									>
										<div class="flex items-center gap-2">
											<span
												class={`rounded px-1.5 py-0.5 text-xs font-medium ${
													marker.severity === 8
														? 'bg-red-500 text-red-100'
														: marker.severity === 4
															? 'bg-yellow-500 text-yellow-100'
															: 'bg-blue-500 text-blue-100'
												}`}
											>
												{marker.severity === 8
													? 'Error'
													: marker.severity === 4
														? 'Warning'
														: 'Info'}
											</span>
											<span class="text-xs text-zinc-400">
												Line {marker.startLineNumber}:{marker.startColumn}
											</span>
											<!-- goto btn -->
											<button
												class="ml-auto rounded-md bg-zinc-700 px-2 py-1 text-xs font-bold text-zinc-200 opacity-70 hover:bg-zinc-600 hover:text-zinc-100 hover:opacity-100"
												disabled={runningGame}
												onclick={() => {
													codeEditor?.setPosition({
														lineNumber: marker.startLineNumber,
														column: marker.startColumn
													});
													codeEditor?.focus();
													// Optionally, add a selection to highlight the error
													codeEditor?.setSelection({
														startLineNumber: marker.startLineNumber,
														startColumn: marker.startColumn,
														endLineNumber: marker.endLineNumber || marker.startLineNumber,
														endColumn: marker.endColumn || marker.startColumn + 1
													});
													codeEditor?.revealLineInCenter(marker.startLineNumber);
												}}
											>
												Go to line
											</button>
										</div>
										<p
											class={`mt-1 text-sm ${
												marker.severity === 8
													? 'text-red-200'
													: marker.severity === 4
														? 'text-yellow-200'
														: 'text-blue-200'
											}`}
										>
											{marker.message}
										</p>
										{#if marker.source}
											<p class="mt-0.5 text-xs text-zinc-400">Source: {marker.source}</p>
										{/if}
									</div>
								{/each}
							</div>
						</Tabs.Content>
					</Tabs.Root>
				</Pane>
			</PaneGroup>
		</Pane>
	</PaneGroup>
</div>

<style>
	.line-pulse {
		background-color: rgb(255, 0, 0);
	}
</style>
