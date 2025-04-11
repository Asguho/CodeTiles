/**
 * The types of tiles inthe game.
 * Represents the possible tile types:
 * - "unknown": A tile that has not been revealed yet.
 * - "ground": A tile that is walkable and can be traversed.
 * - "base": A tile that represents a player's base.
 * - "ore": A tile that contains ore resources.
 * - "wall": A tile that is impassable and cannot be traversed.
 * 
 */
type TileType = "unknown" | "ground" | "base" | "ore" | "wall";
/**
 * Represents the possible directions a unit can move.
 */
type Direction = "north" | "south" | "east" | "west";
/**
 * Represents the different types of units in the game.
 */
type UnitType = "melee" | "ranged" | "miner";
/**
 * Represents a position on the game map.
 */
interface Position {
  x: number;
  y: number;
}
/**
 * Represents a unit in the game.
 */
interface Unit {
  id: string;
  type: UnitType;
  owner: string;
  health: number;
  position: Position;
  actionTaken?: boolean;
}
/**
 * Represents a unit in the game with methods for movement and interaction.
 */
declare class Unit {
  id: string;
  health: number;
  owner: string;
  type: UnitType;
  position: {
    x: number;
    y: number;
  };
  /**
   * Creates a new unit.
   * @param id - The unique identifier of the unit.
   * @param health - The health of the unit.
   * @param owner - The ID of the player who owns the unit.
   * @param type - The type of the unit (e.g., melee, ranged, miner).
   * @param position - The position of the unit on the map.
   */
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
  /**
   * Moves the unit in the specified direction.
   * @param direction - The direction to move the unit.
   */
  move(direction: Direction): void;
  /**
   * Checks if the target position is within the unit's range.
   * @param target - The target position to check.
   * @returns True if the target is within range, false otherwise.
   */
  isWithinRange(target: { x: number; y: number }): boolean;
  /**
   * Calculates the directions to move towards the target position.
   * @param target - The target position to move towards.
   * @returns An array of directions or null if no path exists.
   */
  moveTowards(
    target: {
      x: number;
      y: number;
    },
  ): null | Direction[];
  /**
   * Checks if the unit is owned by the specified player.
   * @param playerId - The ID of the player to check ownership.
   * @returns True if the unit is owned by the player, false otherwise.
   */
  isOwnedBy(playerId: string): boolean;
  /**
   * Checks if the unit is a miner.
   * @returns True if the unit is a miner, false otherwise.
   */
  isMiner(): this is MinerUnit;
  /**
   * Checks if the unit is a melee unit.
   * @returns True if the unit is a melee unit, false otherwise.
   */
  isMelee(): this is MeleeUnit;
  /**
   * Checks if the unit is a ranged unit.
   * @returns True if the unit is a ranged unit, false otherwise.
   */
  isRanged(): this is RangedUnit;
}
/**
 * Represents a melee unit in the game.
 */
interface MeleeUnit extends Unit {
  /**
   * Attacks the specified target position.
   * @param target - The target position to attack.
   */
  attack(target: { x: number; y: number }): void;
}
/**
 * Represents a ranged unit in the game.
 */
interface RangedUnit extends Unit {
  /**
   * Attacks the specified target position.
   * @param target - The target position to attack.
   */
  attack(target: { x: number; y: number }): void;
}
/**
 * Represents a miner unit in the game.
 */
interface MinerUnit extends Unit {
  /**
   * The inventory of the miner, containing the amount of ore.
   */
  inventory: {
    ore: number;
  };
  /**
   * Mines ore from the specified tile.
   * @param target - The tile to mine ore from.
   */
  mine(target: Tile): void;
  /**
   * Sells the ore in the miner's inventory.
   */
  sell(): void;
}
/**
 * Represents a tile on the game map.
 */
declare class Tile {
  type: TileType;
  position: {
    x: number;
    y: number;
  };
  /**
   * Creates a new tile.
   * @param type - The type of the tile.
   * @param position - The position of the tile on the map.
   */
  constructor(
    type: TileType,
    position: {
      x: number;
      y: number;
    },
  );
  /**
   * Checks if the tile is a base.
   * @returns True if the tile is a base, false otherwise.
   */
  isBase(): this is Base;
}
/**
 * Represents a player's base on the game map.
 */
declare class Base extends Tile {
  owner: string;
  health: number;
  /**
   * Creates a new base.
   * @param owner - The ID of the player who owns the base.
   * @param position - The position of the base on the map.
   * @param health - The health of the base.
   */
  constructor(
    owner: string,
    position: {
      x: number;
      y: number;
    },
    health: number,
  );
}
/**
 * Represents the shop where players can buy units.
 */
declare class Shop {
  #private;
  /**
   * Creates a new shop.
   */
  constructor();
  /**
   * Buys a specified quantity of units of the given type.
   * @param item - The type of unit to buy.
   * @param quantity - The quantity of units to buy.
   */
  buy(item: UnitType, quantity: number): void;
}
/**
 * Represents the game map, which holds a 2D array of tiles and provides methods to interact with the map.
 */
declare class GameMap {
  tiles: Tile[][];
  /**
   * Creates a new game map.
   * @param tiles - A 2D array of tiles representing the game map.
   */
  constructor(tiles: Tile[][]);
  /**
   * Finds the nearest tile of a specific type from a starting position.
   * @param start - The starting position.
   * @param isTarget - A function to determine if a tile is the target type.
   * @returns The nearest tile of the specified type.
   */
  findNearest(
    start: {
      x: number;
      y: number;
    },
    isTarget: (tile: Tile) => boolean,
  ): Tile;
}
/**
 * Represents the primary class that contains all game elements and objects.
 * It contains the playerId, map, units, base, coins, turn, and shop.
 * It is often referenced as the variable `game` in the game loop.
 */
declare class Game {
  readonly playerId: string;
  readonly map: GameMap;
  readonly units: Unit[];
  readonly base: Base;
  readonly coins: number;
  readonly turn: number;
  readonly shop: Shop;
  /**
   * Creates a new game instance.
   */
  constructor();
}
/**
 * Compares two coordinate objects to check if they are equal.
 * @param a - The first coordinate object with x and y properties.
 * @param b - The second coordinate object with x and y properties.
 * @returns True if both coordinates have equal x and y values, false otherwise.
 * @example
 * ```ts
 * const coord1 = { x: 1, y: 2 };
 * const coord2 = { x: 1, y: 2 };
 * console.log(areCordinatesEqual(coord1, coord2)); // true
 * ```
 */
declare function areCordinatesEqual(a: { x: number; y: number }, b: { x: number; y: number }): boolean;
/**
 * Namespace for CodeTiles-related functions and utilities.
 */
declare namespace CodeTiles {
  /**
   * Registers a callback function to be executed on each turn of the game.
   * @param f - The callback function that receives the current game state.
   */
  function onTurn(f: (game: Game) => void): void;
}
