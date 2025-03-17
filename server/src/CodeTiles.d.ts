import type { Direction, LogEntry, ShopAction, TileType, TurnData, UnitAction, UnitType } from "./types.ts";
declare class Unit {
    id: string;
    health: number;
    owner: string;
    type: UnitType;
    position: {
        x: number;
        y: number;
    };
    protected codeTiles: CodeTiles;
    constructor(id: string, health: number, owner: string, type: UnitType, position: {
        x: number;
        y: number;
    }, codeTiles: CodeTiles);
    move(direction: Direction): void;
    moveTowards(target: {
        x: number;
        y: number;
    }, map: Tile[][]): void;
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
    constructor(codeTiles: CodeTiles);
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
    constructor(gameState: TurnData, codeTiles: CodeTiles);
}
declare class CodeTiles {}
declare namespace CodeTiles {
    function onTurn(f: (game: Game) => void): void;
}
