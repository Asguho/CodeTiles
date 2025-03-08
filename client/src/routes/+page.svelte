<script lang="ts">
	import { setupEditor } from '$lib/Editor';
	import { setupGameCanvas, drawGame } from '$lib/GameCanvas';
	import { BASE_URL } from '$lib/utils';
	import { editor } from 'monaco-editor';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import { onMount } from 'svelte';

	let gameCanvas: HTMLCanvasElement;

	console.log('Hello, Vite!', document);

	let codeEditor: editor.IStandaloneCodeEditor | null = null;
	let consoleElement: HTMLPreElement | null = null;
	let lastSavedcode = $state('');




	onMount(async () => {
		console.log('Hello, Vite!', document);
		setupGameCanvas(gameCanvas, 800, 600);
		codeEditor = await setupEditor(document.getElementById('editor')!);

		let res = await fetch('/api/get_code', { method: 'GET', credentials: 'include' });
		if (res.ok) {
			let { code } = await res.json();
			codeEditor?.setValue(code); 
			lastSavedcode = code;
		}
	});
	
	let canRun = $derived(() => lastSavedcode == codeEditor?.getValue());

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

	const url = new URL(`./ws`, location.href);
	url.protocol = url.protocol.replace('http', 'ws');
	let ws = new WebSocket(url.toString());
	ws.onopen = function () {
		console.log('WebSocket is open now on ', url.toString());
	};

	ws.onmessage = function (event: MessageEvent) {
		console.log('WebSocket message received:', event.data);
		try {
			const json = JSON.parse(event.data);
			if (json?.type === 'TURN_DATA') {
				drawGame(gameCanvas, json); 
				updateConsole(json?.logs);
			}
		} catch (error) {
			console.warn('WEBSOKET DATA NOT JSON', event.data);
		}
	};

	ws.onclose = function () {
		console.log('WebSocket is closed now.');
	};

	$effect(() => {
		fetch('/api/auth/validate', {
			method: 'POST',
			credentials: 'include'
		}).then((res) => {
			if (res.status === 401) {
				window.location.href = '/login.html';
			}
		});
	});


	function updateConsole(logs: {level: string, values: string[]}[]) {
		if (!consoleElement) return;
		consoleElement.innerHTML = logs.map(log => {
			let style = '';
			switch (log.level) {
				case 'error':
					style = 'color: #ff5555; font-weight: bold;';
					break;
				case 'warn':
					style = 'color: #ffb86c;';
					break;
				case 'info':
					style = 'color: #8be9fd;';
					break;
				default: // 'log' and others
					style = 'color: #f8f8f2;';
			}
			return `<span class="console-${log.level}" style="${style}">${log.values.map((val) => typeof val === 'string' ? val : JSON.stringify(val)).join(' ')}</span>`;
		}).join('\n');
		consoleElement.scrollTop = consoleElement.scrollHeight;		
	}
</script>

<div class="bg-zinc-900 px-1 pt-1">
	<div
		class="flex h-10 flex-row items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-0.5"
	>
		<div
			class="flex flex-row gap-2 *:rounded-md *:border *:border-zinc-700 *:bg-zinc-800 *:p-1 *:px-2 *:text-zinc-200"
		>
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
			<button
				class=""
				onclick={() => {
					uploadCode();
				}}>Save</button
			>
			<button
				class=""
				onclick={() => {
					fetch('/api/start_game', {
						method: 'POST'
					});
				}}>Run</button
			>
		</div>
	</div>
</div>

<div class="h-[calc(100vh-3rem)] w-screen bg-zinc-900 p-1">
	<PaneGroup direction="horizontal">
		<Pane defaultSize={50}>
			<div class="flex h-full w-full rounded-lg border-2 border-zinc-700 bg-zinc-900 p-1">
				<div id="editor" class="w-full">Loading editor...</div>
			</div>
		</Pane>
		<PaneResizer class="relative flex w-2 items-center justify-center bg-zinc-900">
			<div class="z-10 flex h-7 w-5 items-center justify-center rounded-sm text-zinc-300">
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
			</div>
		</PaneResizer>
		<Pane defaultSize={50}>
			<PaneGroup direction="vertical">
				<Pane defaultSize={50}>
					<div class="flex h-full rounded-lg border border-zinc-700 bg-zinc-800 p-2">
						<canvas bind:this={gameCanvas} class="h-full w-full"></canvas>
					</div>
				</Pane>
				<PaneResizer class="relative flex h-2 items-center justify-center bg-zinc-900">
					<div class="z-10 flex h-5 w-7 items-center justify-center rounded-sm text-zinc-300">
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-horizontal"><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/><circle cx="5" cy="15" r="1"/></svg>
					</div>
				</PaneResizer>
				<Pane defaultSize={50}>
					<div class="flex h-full rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-200">
						<pre bind:this={consoleElement} class="h-full w-full overflow-auto"></pre>
					</div>
				</Pane>
			</PaneGroup>
		</Pane>
	</PaneGroup>
</div>
