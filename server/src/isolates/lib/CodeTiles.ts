import type { Direction, LogEntry, Miner, ShopAction, TileType, TurnData, UnitAction, UnitType } from "../../types.ts";
import { type Cords, Pathfinding } from "./pathfinding.ts";

class Unit {
	id: string;
	health: number;
	owner: string;
	type: UnitType;
	range: number;
	position: { x: number; y: number };
	protected codeTiles: CodeTiles;

	constructor(
		id: string,
		health: number,
		owner: string,
		type: UnitType,
		range: number,
		position: { x: number; y: number },
		codeTiles: CodeTiles
	) {
		this.id = id;
		this.health = health;
		this.owner = owner;
		this.type = type;
		this.range = range;
		this.position = position;
		this.codeTiles = codeTiles;
	}

	move(direction: Direction) {
		this.codeTiles.addAction({
			type: "move",
			unitId: this.id,
			direction,
		});
	}
	isWithinRange(target: { x: number; y: number }) {
		return Math.pow(this.position.x - target.x, 2) + Math.pow(this.position.y - target.y, 2) <= Math.pow(this.range, 2);
	}

	moveTowards(target: { x: number; y: number }, map: Tile[][]): Direction[] | null {
		if (target.x === this.position.x && target.y === this.position.y) {
			console.warn("Target position is the same as current position.");
			return null;
		}

		const isWalkable = (pos: Cords): boolean => {
			const x = pos.x;
			const y = pos.y;

			if (x < 0 || y < 0 || y >= map.length || x >= map[0].length) {
				return false;
			}
			return map[y][x].type !== "wall";
		};
		const path = Pathfinding.findPath(this.position, target, isWalkable);
		if (path && path.length > 0) {
			this.move(path[0]);
		} else {
			console.warn("No valid path found to target position.");
		}
		return path;
	}
	isOwnedBy(playerId: string) {
		return this.owner === playerId;
	}
	isMiner(): this is MinerUnit {
		return this.type === "miner";
	}
	isMelee(): this is MeleeUnit {
		return this.type === "melee";
	}
	isRanged(): this is RangedUnit {
		return this.type === "ranged";
	}
}
class MeleeUnit extends Unit {
	attack(position: Position) {
		this.codeTiles.addAction({
			type: "attack",
			unitId: this.id,
			target: position,
		});
	}
}

class RangedUnit extends Unit {
	attack(position: Position) {
		this.codeTiles.addAction({
			type: "attack",
			unitId: this.id,
			target: position,
		});
	}
}
class MinerUnit extends Unit {
	inventory: { ore: number };
	mine(target: Tile) {
		this.codeTiles.addAction({
			type: "mine",
			unitId: this.id,
			target: target.position,
		});
	}

	sell() {
		this.codeTiles.addAction({
			type: "sell",
			unitId: this.id,
		});
	}

	constructor(
		id: string,
		health: number,
		owner: string,
		type: UnitType,
		range: number,
		position: { x: number; y: number },
		codeTiles: CodeTiles,
		inventory: { ore: number }
	) {
		super(id, health, owner, type, range, position, codeTiles);
		this.inventory = inventory;
	}
}

class Tile {
	type: TileType;
	position: { x: number; y: number };

	constructor(type: TileType, position: { x: number; y: number }) {
		this.type = type;
		this.position = position;
	}
	isBase(): this is Base {
		return this.type === "base";
	}
}

class Base extends Tile {
	owner: string;
	health: number;

	constructor(owner: string, position: { x: number; y: number }, health: number) {
		super("base", position);
		this.owner = owner;
		this.health = health;
	}
}

class Shop {
	#codeTiles: CodeTiles;

	constructor(codeTiles: CodeTiles) {
		this.#codeTiles = codeTiles;
	}

	buy(item: UnitType, quantity: number) {
		this.#codeTiles.addAction({
			type: "buy",
			item,
			quantity,
		});
	}
}
class GameMap {
	tiles: Tile[][];

	constructor(tiles: Tile[][]) {
		this.tiles = tiles;
	}
	findNearest(start: { x: number; y: number }, isTarget: (tile: Tile) => boolean) {
		const isWalkable = (pos: Cords): boolean => {
			const x = pos.x;
			const y = pos.y;
			if (x < 0 || y < 0 || y >= this.tiles.length || x >= this.tiles[0].length) {
				return false;
			}
			return true;
			//   return this.tiles[y][x].type !== "wall";
		};

		const targetCallback = (pos: Cords): boolean => {
			const tile = this.tiles[pos.y][pos.x];
			return isTarget(tile);
		};

		const nearestPos = Pathfinding.findNearest(start, targetCallback, isWalkable);

		if (nearestPos) {
			return this.tiles[nearestPos.y][nearestPos.x];
		}
		return null;
	}
}

class Game {
	readonly playerId: string;
	readonly map: GameMap;
	readonly units: Unit[];
	readonly base: Base;
	readonly coins: number;
	readonly turn: number;
	readonly shop: Shop;

	constructor(gameState: TurnData, codeTiles: CodeTiles) {
		this.playerId = gameState.playerId;
		this.map = new GameMap(
			gameState.map.map((row) =>
				row.map((cell) =>
					cell.type === "base" ? new Base(cell.owner, cell.position, cell.health) : new Tile(cell.type, cell.position)
				)
			)
		);

		this.units = gameState.units.map((unitData) => {
			switch (unitData.type) {
				case "melee":
					return new MeleeUnit(
						unitData.id,
						unitData.health,
						unitData.owner,
						unitData.type,
						gameState.gameSettings.unit[unitData.type].range,
						unitData.position,
						codeTiles
					);
				case "ranged":
					return new RangedUnit(
						unitData.id,
						unitData.health,
						unitData.owner,
						unitData.type,
						gameState.gameSettings.unit[unitData.type].range,
						unitData.position,
						codeTiles
					);
				case "miner":
					return new MinerUnit(
						unitData.id,
						unitData.health,
						unitData.owner,
						unitData.type,
						gameState.gameSettings.unit[unitData.type].range,
						unitData.position,
						codeTiles,
						(unitData as Miner).inventory
					);
				default:
					return new Unit(
						unitData.id,
						unitData.health,
						unitData.owner,
						unitData.type,
						gameState.gameSettings.unit[unitData.type].range,
						unitData.position,
						codeTiles
					);
			}
		});
		this.base = gameState.map[gameState.basePosition.y][gameState.basePosition.x] as Base;
		this.coins = gameState.coins;
		this.turn = gameState.turn;
		this.shop = new Shop(codeTiles);
	}
}

class CodeTiles {
	#game: Game;
	#actions: { units: UnitAction[]; shop: ShopAction[] } = { units: [], shop: [] };
	#logs: LogEntry[] = [];
	#playerFunction?: (game: Game) => void;

	constructor(gameState: TurnData) {
		this.#game = new Game(gameState, this);
		this.hookConsole();
	}

	onTurn(f: (game: Game) => void) {
		this.#playerFunction = f;
	}

	evaluate() {
		if (this.#playerFunction) {
			this.#playerFunction(this.#game);
		}
	}

	addAction(action: UnitAction | ShopAction) {
		if (action.type === "buy") {
			this.#actions.shop.push(action as ShopAction);
		} else {
			this.#actions.units.push(action as UnitAction);
		}
	}

	toJSON() {
		return {
			actions: this.#actions,
			logs: this.#logs,
		};
	}
	hookConsole() {
		type LogMethod = keyof Pick<Console, "log" | "error" | "warn" | "debug">;
		const hookLogType = (logType: LogMethod) => {
			const original = console[logType].bind(console);
			// deno-lint-ignore no-explicit-any
			return (...args: any) => {
				this.#logs.push({
					type: logType,
					values: Array.from(args),
				});
				original(...args);
			};
		};
		(["log", "error", "warn", "debug"] as LogMethod[]).forEach((logType) => {
			console[logType] = hookLogType(logType);
		});
	}
}

// deno-lint-ignore no-namespace
namespace CodeTiles {
	// deno-lint-ignore no-unused-vars
	export function onTurn(f: (game: Game) => void): void {}
}

/**
 * Compares two coordinate objects to check if they are equal.
 *
 * @param a - The first coordinate object with x and y properties
 * @param b - The second coordinate object with x and y properties
 * @returns True if both coordinates have equal x and y values, false otherwise
 * @example
 * ```ts
 * const coord1 = { x: 1, y: 2 };
 * const coord2 = { x: 1, y: 2 };
 * console.log(areCordinatesEqual(coord1, coord2)); // true
 * ```
 */
export function areCordinatesEqual(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
	return a.x === b.x && a.y === b.y;
}

export { CodeTiles };
