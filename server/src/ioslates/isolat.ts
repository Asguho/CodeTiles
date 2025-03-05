Deno.serve(async (req) => {
	try {
		hookConsole();
		console.log("Hello world")
		try {
			let gameinfo = await req.json()
			console.log("gameinfo", gameinfo)
		} catch (e) {
			console.error("no request data")
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
			logs: console.logs
		});
	} catch (e) {
		return Response.json([{level: "error", values: [e.name, e.messsagee, e.stack]}])
	}
});
function hookConsole(){
	if (console.logs === undefined) {
		console.logs = [];
		function hookLogType(logType) {
			const original = console[logType].bind(console)
			return function(){
				console.logs.push({ 
					type: logType, 
					values: Array.from(arguments)
				})
				original.apply(console, arguments)
			}
		}

		['log', 'error', 'warn', 'debug'].forEach(logType=>{
			console[logType] = hookLogType(logType)
		})
	} 
}
