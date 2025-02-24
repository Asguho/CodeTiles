import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Pathfinding } from './user_modules/Pathfinding';

let editor: Monaco.editor.IStandaloneCodeEditor;
let monaco: typeof Monaco;

export async function setupEditor(el: HTMLElement) {
	console.log('setting up editor');

	monaco = (await import('./monaco')).default;
	el.innerHTML = ''; // Clear the container
	editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: 'vs',
		wrappingStrategy: 'advanced',
		wordWrap: 'on',
		minimap: { enabled: false }, // Disable minimap
		stickyScroll: { enabled: false }, // Disable sticky scroll
		lineNumbers: 'off' // Show line numbers
	});
	const model = monaco.editor.createModel(DEFAULT_VAL, 'typescript');
	/* 	editor.onDidChangeModelContent(() => {
		body = editor.getValue();
	}); */
	//maybe custom theme here maybe ?
	editor.setModel(model);

	console.log('editor setup complete', editor);
	return editor;
}

export const DEFAULT_VAL = `// This is a comment
function hello(name: string) {
	console.log('Hello, ' + name);
}

hello('World');
`;
