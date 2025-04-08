import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Pathfinding } from './user_modules/Pathfinding';
import { BASE_URL } from './utils';

let editor: Monaco.editor.IStandaloneCodeEditor;
let monaco: typeof Monaco;

const theme: Monaco.editor.IStandaloneThemeData = {
	base: 'vs-dark' as Monaco.editor.BuiltinTheme,
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '76db6a' },
		{ token: 'keyword', foreground: '71b8ff' },
		{ token: 'string', foreground: 'ffc065' },
		{ token: 'bracket', foreground: '71b8ff' }
	],
	colors: {
		'editor.foreground': '#FFFFFF',
		'editor.background': '#18181b',
		'editorCursor.foreground': '#528fff',
		'editorLineNumber.foreground': '#FFFFFF'
		/* 'editor.selectionBackground': '#88000030' */
	}
};

export async function setupEditor(el: HTMLElement) {
	console.log('setting up editor');

	monaco = (await import('./monaco')).default;

	monaco.editor.defineTheme('myTheme', theme);

	//fetch the CodeTiles.d.ts file from the server
	const response = await fetch(BASE_URL + '/api/types', { credentials: 'include' });
	const types = await response.text();
	const libUri = 'ts:filename/codetiles.d.ts';

	// validation settings
	monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: false,
		noSyntaxValidation: false
	});

	// compiler options
	const defaults = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
	monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
		/* ...defaults, */
		target: monaco.languages.typescript.ScriptTarget.ESNext,
		/* noLib: true, */
		allowNonTsExtensions: true
	});

	monaco.languages.typescript.javascriptDefaults.addExtraLib(types, libUri);
	monaco.editor.createModel(types, 'typescript', monaco.Uri.parse(libUri));

	el.innerHTML = '';
	const editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: 'myTheme',
		fontFamily: 'JetBrains Mono',
		inlayHints: {
			enabled: 'on'
		},
		fontLigatures: true,
		language: 'javascript',
		wrappingStrategy: 'advanced',
		value: DEFAULT_VAL,
		wordWrap: 'on',
		minimap: { enabled: false }, // Disable minimap
		stickyScroll: { enabled: false }, // Disable sticky scroll
		lineNumbers: 'off', // Show line numbers
		//allow suggestions in strings
		quickSuggestions: {
			strings: true,
			other: true,
			comments: true
		}
	});

	console.log('editor setup complete', editor);

	return editor;
}

export const DEFAULT_VAL = /*js*/ `CodeTiles.onTurn((game)=>{
	// Your code goes here
	// All the code in here runs each turn
	// You can use the game object to access the game state and make decisions
	
	console.log("Hello world!");
});`;
