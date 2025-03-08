type tileType = "unknown" | "ground" | "wall" | "ore";
type unitType = "melee" | "ranged" | "miner";
type direction = "north" | "south" | "east" | "west";
declare class unit {
	id: string;
	health: number;
	type: unitType;
	position: {
		x: number;
		y: number;
	};
	protected game?: CodeTiles;
	constructor(
		id: string,
		health: number,
		type: unitType,
		position: {
			x: number;
			y: number;
		},
		game?: CodeTiles
	);
	move(direction: direction): void;
}
declare class tile {
	type: tileType;
	position: {
		x: number;
		y: number;
	};
	constructor(
		type: tileType,
		position: {
			x: number;
			y: number;
		}
	);
}
declare class base {
	id: string;
	owner: string;
	position: {
		x: number;
		y: number;
	};
	health: number;
	constructor(
		id: string,
		owner: string,
		position: {
			x: number;
			y: number;
		},
		health: number
	);
}
declare class shop {
	game?: CodeTiles;
	constructor(game?: CodeTiles);
	buy(item: unitType, quantity: number): void;
}
declare class CodeTiles {
	#private;
	readonly map: tile[][];
	readonly units: unit[];
	readonly bases: base[];
	readonly coins: number;
	readonly turn: number;
	readonly shop: shop;
	constructor(gameState: any);
	addAction(action: any): void;
	hookConsole(): void;
	toJSON(): {
		actions: {
			units: any[];
			shop: any[];
		};
		logs: any[];
	};
}
