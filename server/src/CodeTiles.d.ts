export type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
export type unitType = "melee" | "ranged" | "miner";
export type direction = "north" | "south" | "east" | "west";

export class unit {
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

export class tile {
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

export class base extends tile {
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

export class shop {
	game?: CodeTiles;
	constructor(game?: CodeTiles);
	buy(item: unitType, quantity: number): void;
}

export class Game {
	readonly playerId: string;
	readonly map: tile[][];
	readonly units: unit[];
	readonly base: base;
	readonly coins: number;
	readonly turn: number;
	readonly shop: shop;
	constructor(gameState: any, codeTiles: CodeTiles);
}

export class CodeTiles {
	#private: any;
	constructor(gameState: any);
	onTurn(f: (game: Game) => void): void;
}

interface CodeTilesConstructor {
	new (gameState: any): CodeTiles;
}

interface GameConstructor {
	new (gameState: any, codeTiles: CodeTiles): Game;
}

interface UnitConstructor {
	new (
		id: string,
		health: number,
		owner: string,
		type: unitType,
		position: { x: number; y: number },
		game?: CodeTiles
	): unit;
}

interface TileConstructor {
	new (type: tileType, position: { x: number; y: number }): tile;
}

interface BaseConstructor {
	new (owner: string, position: { x: number; y: number }, health: number): base;
}

interface ShopConstructor {
	new (game?: CodeTiles): shop;
}

declare global {
	const CodeTiles: CodeTilesConstructor;
	const Game: GameConstructor;
	const unit: UnitConstructor;
	const tile: TileConstructor;
	const base: BaseConstructor;
	const shop: ShopConstructor;
}

export {};
