export function getCloudCode(code: string) {
  return /*js*/ `
		import { CodeTiles as _CodeTiles } from "./CodeTiles.ts";
		Deno.serve(async (req) => {
			try {
				let _gameinfo: any;
				try {
					_gameinfo = await req.json();
				} catch (e) {
					return Response.json({logs: [{level: "error", values: ["No GameData JSON", "Please open the app through https://codetiles.voe.dk/"]}]})
				}
				const CodeTiles = new _CodeTiles(_gameinfo);
				console.log("GameData", _gameinfo);

				try {
					${code}
					CodeTiles.evaluate();
				} catch (evalError) {
					const { actions, logs } = CodeTiles.toJSON();
					return Response.json({actions, logs: [...logs, {level: "error", values: [evalError.name, evalError.message, evalError.stack]}]})
				}
				
				return Response.json(CodeTiles)
			} catch (e: any) {
				return Response.json({logs: [{level: "error", values: ["Backend code error", e.name, e.message, e.stack]}]})
			}
		});
	`;
}
