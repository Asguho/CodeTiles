<script lang="ts">
	import { setupEditor } from '$lib/Editor';
	import { setupGameCanvas } from '$lib/GameCanvas';
	import { editor } from 'monaco-editor';
	import { PaneGroup, Pane, PaneResizer } from 'paneforge';
	import { onMount } from 'svelte';

	let gameCanvas: HTMLCanvasElement;

	console.log('Hello, Vite!', document);

	let codeEditor: editor.IStandaloneCodeEditor | null = null;

	onMount(async () => {
		console.log('Hello, Vite!', document);
		setupGameCanvas(gameCanvas, 800, 600);
		codeEditor = await setupEditor(document.getElementById('editor')!);
	});

	async function uploadCode() {
		console.log('Uploading code...');
		const code = codeEditor?.getValue();
		if (!code) return;
		const response = await fetch('http://localhost:8000/api/upload_code', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ code })
		});
		console.log('Response:', response);
	}
</script>

<div
	class="m-1 flex h-10 flex-row items-center justify-between rounded-lg border border-zinc-300 bg-zinc-100 p-0.5"
>
	<div
		class="flex flex-row gap-2 *:rounded-md *:border *:border-zinc-300 *:bg-zinc-100 *:p-1 *:px-2"
	>
		<button
			class=""
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
		<!-- dropdown -->
		<button
			class=""
			onclick={() => {
				/* Logic */
			}}>Save</button
		>
	</div>
	<div
		class="flex flex-row gap-2 *:rounded-md *:border *:border-zinc-300 *:bg-zinc-100 *:p-1 *:px-2"
	>
		<button
			class=""
			onclick={() => {
				/* Logic */
			}}>Test</button
		>
		<button
			class=""
			onclick={() => {
				uploadCode();
			}}>Run</button
		>
	</div>
</div>

<div class="h-[calc(100vh-3rem)] w-screen p-1">
	<PaneGroup direction="horizontal">
		<Pane defaultSize={50}>
			<div class="flex h-full w-full rounded-lg border border-zinc-300 p-1">
				<div id="editor" class="w-full">Loading editor...</div>
			</div>
		</Pane>
		<PaneResizer class="bg-background relative flex w-2 items-center justify-center">
			<div class="bg-brand z-10 flex h-7 w-5 items-center justify-center rounded-sm">
				<!-- prettier-ignore -->
				<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
			</div>
		</PaneResizer>
		<Pane defaultSize={50}>
			<PaneGroup direction="vertical">
				<Pane defaultSize={50}>
					<div class="flex h-full rounded-lg border border-zinc-300 p-2">
						<canvas bind:this={gameCanvas} class="h-full w-full"></canvas>
					</div>
				</Pane>
				<PaneResizer class="bg-background relative flex h-2 items-center justify-center">
					<div class="bg-brand z-10 flex h-5 w-7 items-center justify-center rounded-sm">
						<!-- prettier-ignore -->
						<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-horizontal"><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/><circle cx="5" cy="15" r="1"/></svg>
					</div>
				</PaneResizer>
				<Pane defaultSize={50}>
					<div class="flex h-full rounded-lg border border-zinc-300 p-2">
						<pre>
console&gt; ahh goofy
						</pre>
					</div>
				</Pane>
			</PaneGroup>
		</Pane>
	</PaneGroup>
</div>
