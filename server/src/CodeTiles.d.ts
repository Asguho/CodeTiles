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
  constructor(id: string, health: number, owner: string, type: UnitType, position: {
    x: number;
    y: number;
  });
  move(direction: Direction): void;
  moveTowards(target: {
    x: number;
    y: number;
  }, map: Tile[][]): void;
  isOwnedBy(playerId: string): boolean;
}
declare class Tile {
  type: TileType;
  position: {
    x: number;
    y: number;
  };
  constructor(type: TileType, position: {
    x: number;
    y: number;
  });
}
declare class Base extends Tile {
  owner: string;
  health: number;
  constructor(owner: string, position: {
    x: number;
    y: number;
  }, health: number);
}
declare class Shop {
  #private;
  constructor();
  buy(item: UnitType, quantity: number): void;
}
declare class GameMap {
  tiles: Tile[][];
  constructor(tiles: Tile[][]);
  findNearest(start: {
    x: number;
    y: number;
  }, isTarget: (tile: Tile) => boolean): Tile;
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

declare namespace CodeTiles {
  function onTurn(f: (game: Game) => void): void;
}
