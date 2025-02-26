import './style.css';
import { setupGameCanvas } from './GameCanvas.ts';
import { setupEditor } from './Editor.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
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
`;

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
