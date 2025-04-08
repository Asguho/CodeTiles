export function getCloudCode(code: string) {
  return /*js*/ `
		import { CodeTiles as _CodeTiles } from "./CodeTiles.ts";
		Deno.serve(async (req) => {
			try {
				let _gameinfo: any;
				try {
					_gameinfo = await req.json();
				} catch (e) {
					return Response.json({logs: [{type: "error", values: ["No GameData JSON", "Please open the app through https://codetiles.voe.dk/"]}]})
				}
				const CodeTiles = new _CodeTiles(_gameinfo);

				try {
					${code}
					CodeTiles.evaluate();
				} catch (evalError) {
					const { actions, logs } = CodeTiles.toJSON();
					return Response.json({actions, logs: [...logs, {type: "error", values: [evalError.name, evalError.message, evalError.stack]}]})
				}
				
				function removeCircularReferences() {
					const seen = new WeakSet();
					return (key, value) => {
						if (typeof value === "object" && value !== null) {
						if (seen.has(value)) {
							return "[Circular]"; // Replace circular references with this string
						}
						seen.add(value);
						}
						return value;
					};
				}

				const s = JSON.stringify(CodeTiles.toJSON(), removeCircularReferences(), 2);
				return new Response(s);
				
				// return Response.json(CodeTiles)
			} catch (e: any) {
				return Response.json({logs: [{type: "error", values: ["Backend code error", e.name, e.message, e.stack]}]})
			}
		});
	`;
}
