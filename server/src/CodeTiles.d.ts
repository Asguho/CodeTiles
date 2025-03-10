declare type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
declare type unitType = "melee" | "ranged" | "miner";
declare type direction = "north" | "south" | "east" | "west";

/** @internal */
declare class unit {
	id: string;
	health: number;
	owner: string;
	type: unitType;
	position: {
		x: number;
		y: number;
	};
	protected game?: CodeTiles;
	constructor(
		id: string,
		health: number,
		owner: string,
		type: unitType,
		position: {
			x: number;
			y: number;
		},
		game?: CodeTiles
	);
	move(direction: direction): void;
}

/** @internal */
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

/** @internal */
declare class base extends tile {
	owner: string;
	health: number;
	constructor(
		owner: string,
		position: {
			x: number;
			y: number;
		},
		health: number
	);
}

/** @internal */
declare class shop {
	game?: CodeTiles;
	constructor(game?: CodeTiles);
	buy(item: unitType, quantity: number): void;
}

/** @internal */
declare class Game {
	readonly playerId: string;
	readonly map: tile[][];
	readonly units: unit[];
	readonly base: base;
	readonly coins: number;
	readonly turn: number;
	readonly shop: shop;
	constructor(gameState: any, codeTiles: CodeTiles);
}

/** @internal */
declare class CodeTiles {
	#private: any;
	constructor(gameState: any);
	onTurn(f: (game: Game) => void): void;
}

declare namespace CodeTiles {
	function onTurn(f: (game: Game) => void): void;
	// Add other global methods as needed
}
