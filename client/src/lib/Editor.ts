import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Pathfinding } from "./user_modules/Pathfinding";

let editor: Monaco.editor.IStandaloneCodeEditor;
let monaco: typeof Monaco;

const theme: Monaco.editor.IStandaloneThemeData = {
	base: "vs-dark" as Monaco.editor.BuiltinTheme,
	inherit: true,
	rules: [
		{ token: "comment", foreground: "76db6a" },
		{ token: "keyword", foreground: "71b8ff" },
		{ token: "string", foreground: "ffc065" },
		{ token: "bracket", foreground: "71b8ff" },
	],
	colors: {
		"editor.foreground": "#FFFFFF",
		"editor.background": "#18181b",
		"editorCursor.foreground": "#528fff",
		"editorLineNumber.foreground": "#FFFFFF",
		/* 'editor.selectionBackground': '#88000030' */
	},
};

export async function setupEditor(el: HTMLElement) {
	console.log("setting up editor");

	monaco = (await import("./monaco")).default;

	monaco.editor.defineTheme("myTheme", theme);

	el.innerHTML = ""; // Clear the container
	editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: "myTheme",
		fontFamily: "JetBrains Mono",
		fontLigatures: true,
		wrappingStrategy: "advanced",
		wordWrap: "on",
		minimap: { enabled: false }, // Disable minimap
		stickyScroll: { enabled: false }, // Disable sticky scroll
		lineNumbers: "off", // Show line numbers
	});
	const model = monaco.editor.createModel(DEFAULT_VAL, "typescript");
	/* 	editor.onDidChangeModelContent(() => {
		body = editor.getValue();
	}); */
	//maybe custom theme here maybe ?
	editor.setModel(model);

	console.log("editor setup complete", editor);
	return editor;
}

export const DEFAULT_VAL = /*html*/ `
Deno.serve((req) => {
	// This is a dummy implementation of a game API
	return Response.json({
		actions: {
			units: [
				{ unitId: "unit1", action: "move", direction: "north" },
				{ unitId: "unit2", action: "attack", target: "enemy1" },
				{ unitId: "unit3", action: "mine" }
			],
			shop: [
				{ type: "buy", item: "soldier", quantity: 2 },
				{ type: "buy", item: "tank", quantity: 1 }
			]
		},
		logs: [
			{
				level: "info",
				message: "Hello world",
			}
		]
	});
});
`;
