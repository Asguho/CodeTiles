export function getCloudCode(code: string) {
	return /*js*/ `
		import { CodeTiles as _CodeTiles } from "./CodeTiles.ts";
		Deno.serve(async (req) => {
			try {
				let _gameinfo: any;
				try {
					_gameinfo = await req.json();
				} catch (e) {
					return Response.json({logs: [{level: "error", values: ["no request data"]}]})
				}
				const CodeTiles = new _CodeTiles(_gameinfo);

				{
					${code}
				}
				
				CodeTiles.evaluate();
				return Response.json(CodeTiles)
			} catch (e: any) {
				return Response.json({logs: [{level: "error", values: [e.name, e.message, e.stack]}]})
			}
		});
	`
}


