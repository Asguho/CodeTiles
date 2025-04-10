type TileType = "unknown" | "ground" | "base" | "ore" | "wall";
type Direction = "north" | "south" | "east" | "west";
type UnitType = "melee" | "ranged" | "miner";
interface Position {
  x: number;
  y: number;
}
interface Unit {
  id: string;
  type: UnitType;
  owner: string;
  health: number;
  position: Position;
  actionTaken?: boolean;
}
declare class Unit {
  id: string;
  health: number;
  owner: string;
  type: UnitType;
  position: {
    x: number;
    y: number;
  };
  constructor(
    id: string,
    health: number,
    owner: string,
    type: UnitType,
    position: {
      x: number;
      y: number;
    },
  );
  move(direction: Direction): void;
  isWithinRange(target: { x: number; y: number }): boolean;
  moveTowards(
    target: {
      x: number;
      y: number;
    },
  ): null | Direction[];
  isOwnedBy(playerId: string): boolean;
  isMiner(): this is MinerUnit;
  isMelee(): this is MeleeUnit;
  isRanged(): this is RangedUnit;
}

interface MeleeUnit extends Unit {
  attack(target: { x: number; y: number }): void;
}
interface RangedUnit extends Unit {
  attack(target: { x: number; y: number }): void;
}

interface MinerUnit extends Unit {
  inventory: {
    ore: number;
  };
  mine(target: Tile): void;
  sell(): void;
}
declare class Tile {
  type: TileType;
  position: {
    x: number;
    y: number;
  };
  constructor(
    type: TileType,
    position: {
      x: number;
      y: number;
    },
  );

  isBase(): this is Base;
}

declare class Base extends Tile {
  owner: string;
  health: number;
  constructor(
    owner: string,
    position: {
      x: number;
      y: number;
    },
    health: number,
  );
}
declare class Shop {
  #private;
  constructor();
  buy(item: UnitType, quantity: number): void;
}
declare class GameMap {
  tiles: Tile[][];
  constructor(tiles: Tile[][]);
  findNearest(
    start: {
      x: number;
      y: number;
    },
    isTarget: (tile: Tile) => boolean,
  ): Tile;
}
declare class Game {
  readonly playerId: string;
  readonly map: GameMap;
  readonly units: Unit[];
  readonly base: Base;
  readonly coins: number;
  readonly turn: number;
  readonly shop: Shop;
  constructor();
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
declare function areCordinatesEqual(a: { x: number; y: number }, b: { x: number; y: number }): boolean;

declare namespace CodeTiles {
  function onTurn(f: (game: Game) => void): void;
}
