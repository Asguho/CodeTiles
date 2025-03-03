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