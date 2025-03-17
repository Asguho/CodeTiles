export function getCloudCode(code: string) {
	return /*js*/ `
		import { CodeTiles as _CodeTiles } from "http://codetiles.voe.dk/CodeTilesClientLib/CodeTiles.ts";
		Deno.serve(async (req) => {
			try {
				let _gameinfo: any;
				try {
					_gameinfo = await req.json();
				} catch (e) {
					console.error(e);
					return Response.json({logs: [{type: "error", values: ["no request data or wrong format"]}]})
				}
				const CodeTiles = new _CodeTiles(_gameinfo);

				try {
					${code}
					CodeTiles.evaluate();
				} catch (evalError) {
					const data = CodeTiles.toJSON();
					console.error(evalError);
					return Response.json({actions: data.actions, logs: [...data.logs, {type: "error", values: [evalError.name, evalError.message]}]})
				}
				console.log(CodeTiles.toJSON());
				return Response.json(CodeTiles.toJSON())
			} catch (e: any) {
				console.error(e);
				return Response.json({logs: [{type: "error", values: [e.name, e.message, e.stack]}]})
			}
		});
	`;
}
