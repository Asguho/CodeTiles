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
	const model = monaco.editor.createModel(DEFAULT_VAL, 'typescript');
	/* 	editor.onDidChangeModelContent(() => {
		body = editor.getValue();
	}); */
	//maybe custom theme here maybe ?
	editor.setModel(model);

	console.log('editor setup complete', editor);

	//load code from server
	let res = await fetch('/api/get_code', { method: 'GET', credentials: 'include' });
	if (res.ok) {
		let { code } = await res.json();
		editor.setValue(code);
	}

	return editor;
}

export const DEFAULT_VAL = /*js*/ `
Deno.serve(async (req) => {
	console.stdlog = console.log.bind(console);
	console.logs = [];
	console.log = function () {
		console.logs.push(JSON.stringify(Array.from(arguments)));
		console.stdlog.apply(console, arguments);
	}
	console.log("hej")
	try {
		let gameinfo = await req.json()
		console.log("gameinfo", gameinfo)
	} catch (e) {
		console.log("no reqesut data")
	}
	return Response.json({
		actions: {
			units: [
				{ unitId: "unit1", action: "move", direction: "north" },
				{ unitId: "unit2", action: "attack", target: "enemy1" },
				{ unitId: "unit3", action: "mine" }
			],
			shop: [
				{ type: "buy", item: "melee", quantity: 2 },
				{ type: "buy", item: "ranged", quantity: 1 }
			]
		},
		logs: [
			console.logs.map((message) => { return { level: "INFO", message } })
		]
	});
});
`;
