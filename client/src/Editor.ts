import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Pathfinding } from "./user_modules/Pathfinding.ts";


let editor: Monaco.editor.IStandaloneCodeEditor;
let monaco: typeof Monaco;

export async function setupEditor(el: HTMLElement) {
	monaco = (await import("./monaco.ts")).default;
	editor = monaco.editor.create(el, {
		automaticLayout: true,
		theme: "vs",
		wrappingStrategy: "advanced",
		wordWrap: "on",
		value: `// Welcome to the editor!`,
	});
	const model = monaco.editor.createModel("", "typescript");
	/* 	editor.onDidChangeModelContent(() => {
		body = editor.getValue();
	}); */
	//maybe custom theme here maybe ?
	editor.setModel(model);
	
	//expose Pathfinding module to the window object
	(window as any).Pathfinding = Pathfinding;
	return editor;
}
