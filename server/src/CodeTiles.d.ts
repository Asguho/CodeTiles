type TileType = "unknown" | "ground" | "wall" | "ore" | "base";
type UnitType = "melee" | "ranged" | "miner";
type Direction = "north" | "south" | "east" | "west";
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
declare class Game {
    readonly playerId: string;
    readonly map: Tile[][];
    readonly units: Unit[];
    readonly base: Base;
    readonly coins: number;
    readonly turn: number;
    readonly shop: Shop;
    constructor(gameState: any, codeTiles: CodeTiles);
}
declare class CodeTiles {
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
declare namespace CodeTiles {
    function onTurn(f: (game: Game) => void): void;
}
