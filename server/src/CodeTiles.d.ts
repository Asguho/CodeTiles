import { type direction } from "./utils.ts";
type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
type unitType = "melee" | "ranged" | "miner";
declare class Position {
	x: number;
	y: number;
	protected game: Game;
	constructor(x: number, y: number, game: Game);
	findNearest(callback: (tile: tile) => boolean): tile | null;
}
declare class unit {
	id: string;
	health: number;
	owner: string;
	type: unitType;
	position: Position;
	protected codeTiles: CodeTiles;
	constructor(id: string, health: number, owner: string, type: unitType, position: Position, codeTiles: CodeTiles);
	move(direction: direction): void;
	moveTowards(target: Position): void;
}
declare class tile {
	type: tileType;
	position: Position;
	constructor(type: tileType, position: Position);
}
declare class base extends tile {
	owner: string;
	health: number;
	constructor(owner: string, position: Position, health: number);
}
declare class shop {
	#private;
	constructor(game: CodeTiles);
	buy(item: unitType, quantity: number): void;
}
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
declare class CodeTiles {
	#private;
	game: Game;
	constructor(gameState: any);
	onTurn(f: (game: Game) => void): void;
	evaluate(): void;
	addAction(action: any): void;
	toJSON(): {
		actions: {
			units: any[];
			shop: any[];
		};
		logs: any[];
	};
	hookConsole(): void;
}
declare namespace CodeTiles {
	function onTurn(f: (game: Game) => void): void;
}
export { CodeTiles };
