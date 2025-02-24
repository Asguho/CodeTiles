<script lang="ts" module>
	export const prerender = true;
	import { setupEditor } from '$lib/Editor';
	import { setupGameCanvas } from '$lib/GameCanvas';

	setupGameCanvas(document.querySelector<HTMLCanvasElement>('#gameCanvas')!, 800, 600);

	const editor = await setupEditor(document.getElementById('editor')!);

	document.getElementById('run_button')!.addEventListener('click', async () => {
		await fetch('http://localhost:8000/api/upload_code', {
			method: 'POST',
			body: editor.getValue()
		});
		console.log(editor.getValue());
	});

	// Add resizing logic:
	const container = document.querySelector('.container') as HTMLElement;
	const resizer = document.getElementById('resizer')!;

	resizer.addEventListener('mousedown', (e) => {
		document.addEventListener('mousemove', resizePanels);
		document.addEventListener('mouseup', stopResize);
	});

	function resizePanels(e: MouseEvent) {
		const bounds = container.getBoundingClientRect();
		const newWidthEditor = e.clientX - bounds.left;
		const editorPercent = (newWidthEditor / bounds.width) * 100;
		container.style.gridTemplateColumns = `${editorPercent}% 5px ${100 - editorPercent}%`;
	}

	function stopResize() {
		document.removeEventListener('mousemove', resizePanels);
		document.removeEventListener('mouseup', stopResize);
	}
</script>

<div class="container">
	<button id="run_button">Run</button>
	<div class="editor" id="editor">
		<!-- Editor content -->
	</div>
	<div id="resizer"></div>
	<div class="sidepanel">
		<div class="gamewindow">
			<canvas id="gameCanvas"></canvas>
		</div>
		<div class="gameinfo">
			<pre>
Hello, Vite!
        </pre>
		</div>
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 50% 5px 50%;
		grid-template-rows: 1fr;
		height: 100vh;
		overflow: hidden;
	}

	body {
		margin: 0;
		padding: 0;
		font-family: Arial, sans-serif;
		background-color: #f0f0f0;
		color: #333;
		overflow: hidden;
	}

	.editor {
		grid-column: 1 / 2;
		grid-row: 1 / 3;
		background-color: #f0f0f0;
		padding: 10px;
		position: relative;
	}

	.sidepanel {
		grid-column: 3 / 4;
		display: grid;
		grid-template-rows: 1fr 1fr;
		height: 100vh;
	}

	.gamewindow {
		grid-row: 1 / 2;
		background-color: #e0e0e0;
		padding: 10px;
		width: 100%;
		aspect-ratio: 1 / 1;
	}
	.gamewindow canvas {
		width: 100%;
		height: 100%;
	}

	.gameinfo {
		grid-row: 2 / 3;
		background-color: #d0d0d0;
		padding: 10px;
		height: 100%;
	}
	#run_button {
		position: absolute;
		right: 10px;
	}

	/* New resizer styling */
	#resizer {
		background: rgb(85, 0, 255);
		cursor: col-resize;
		/* full height to span panels */
	}
</style>
