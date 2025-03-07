import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Pathfinding } from './user_modules/Pathfinding';

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

	el.innerHTML = ''; // Clear the container
	editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: 'myTheme',
		fontFamily: 'JetBrains Mono',
		fontLigatures: true,
		wrappingStrategy: 'advanced',
		wordWrap: 'on',
		minimap: { enabled: false }, // Disable minimap
		stickyScroll: { enabled: false }, // Disable sticky scroll
		lineNumbers: 'off' // Show line numbers
	});

	//fetch the CodeTiles.d.ts file from the server
	const response = await fetch('/api/types');
	const types = await response.text();
	var libUri = 'ts:filename/codetiles.d.ts';

	console.log('types', types);

	// validation settings
	monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: true,
		noSyntaxValidation: false
	});

	// compiler options
	monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
		target: monaco.languages.typescript.ScriptTarget.ES2015,
		allowNonTsExtensions: true
	});

	// Register the custom types for the game api
	monaco.languages.typescript.javascriptDefaults.addExtraLib(types, libUri);
	monaco.languages.typescript.typescriptDefaults.addExtraLib(types, libUri);

	const model = monaco.editor.createModel(DEFAULT_VAL, 'typescript', monaco.Uri.parse(libUri));

	editor.setModel(model);

	console.log('editor setup complete', editor);

	//load code from server

	return editor;
}

export const DEFAULT_VAL = /*js*/ `
CodeTiles.onTurn((game)=>{
	game.map.forEach((row)=>console.log(row))
})
`;
