import { CodeTiles as _CodeTiles } from "./CodeTiles.ts";
Deno.serve(async (req) => {
	try {
		let _gameinfo: any;
		try {
			_gameinfo = await req.json();
		} catch (e) {
			return Response.json([{level: "error", values: ["no request data"]}])
		}
        const CodeTiles = new _CodeTiles(_gameinfo);

        {
            /* [USER CODE HERE] */
        }
		
        return Response.json(codeTiles)
	} catch (e: any) {
		return Response.json([{level: "error", values: [e.name, e.message, e.stack]}])
	}
});

