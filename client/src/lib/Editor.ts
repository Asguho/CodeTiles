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
	const response1 = await fetch(BASE_URL + '/api/types/1', { credentials: 'include' });
	const response2 = await fetch(BASE_URL + '/api/types/2', { credentials: 'include' });
	const response3 = await fetch(BASE_URL + '/api/types/3', { credentials: 'include' });
	const types1 = await response1.text();
	const types2 = await response2.text();
	const types3 = await response3.text();
	const libUri1 = 'ts:filename/codetiles.d.ts';

	//combine the files into one and properly format as a valid TS declaration file
	let combinedTypes = types1 + '\n\n' + types2 + '\n\n' + types3;
	// Remove imports
	combinedTypes = combinedTypes.replace(/import.*\n/g, '');
	// Remove export statements
	combinedTypes = combinedTypes.replace(/export\s*{[^}]*}\s*;?/g, '');
	// Convert remaining export keywords to declare
	combinedTypes = combinedTypes.replace(
		/export\s+(?=(type|interface|class|enum|const|function|namespace))/g,
		'declare '
	);
	// Remove duplicate declarations by keeping only the first occurrence
	const typeDeclarations = new Map();
	const processedLines = combinedTypes
		.split('\n')
		.filter((line) => {
			const typeMatch = line.match(/^(declare\s+)?(type|interface|class)\s+([a-zA-Z0-9_]+)/);
			if (typeMatch) {
				const typeName = typeMatch[3];
				if (typeDeclarations.has(typeName)) {
					return false;
				}
				typeDeclarations.set(typeName, true);
			}
			return true;
		})
		.join('\n');

	combinedTypes = processedLines;
	console.log('combined types', combinedTypes);

	// validation settings
	monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: false,
		noSyntaxValidation: false
	});

	// compiler options
	monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
		target: monaco.languages.typescript.ScriptTarget.ES2015,
		allowNonTsExtensions: true
	});

	monaco.languages.typescript.javascriptDefaults.addExtraLib(combinedTypes, libUri1);
	monaco.editor.createModel(combinedTypes, 'typescript', monaco.Uri.parse(libUri1));

	el.innerHTML = '';
	const editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: 'myTheme',
		fontFamily: 'JetBrains Mono',
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

export const DEFAULT_VAL = /*js*/ `
CodeTiles.onTurn((game)=>{
	game.map.forEach((row)=>console.log(row))
})
`;
