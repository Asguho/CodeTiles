declare module "CodeTiles" {
	type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
	type unitType = "melee" | "ranged" | "miner";
	type direction = "north" | "south" | "east" | "west";
	class unit {
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
	class tile {
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
	class base extends tile {
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
	class shop {
		game?: CodeTiles;
		constructor(game?: CodeTiles);
		buy(item: unitType, quantity: number): void;
	}
	class Game {
		readonly playerId: string;
		readonly map: tile[][];
		readonly units: unit[];
		readonly base: base;
		readonly coins: number;
		readonly turn: number;
		readonly shop: shop;
		constructor(gameState: any, codeTiles: CodeTiles);
	}
	class CodeTiles {
		#private;
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
}
