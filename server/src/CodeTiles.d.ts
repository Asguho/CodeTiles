type tileType = 'unknown' | 'ground' | 'wall' | 'ore' | 'base';
type unitType = 'melee' | 'ranged' | 'miner';
type direction = 'north' | 'south' | 'east' | 'west';
declare class unit {
    id: string;
    health: number;
    owner: string;
    type: unitType;
    position: {
        x: number;
        y: number;
    };
    protected game: CodeTiles;
    constructor(id: string, health: number, owner: string, type: unitType, position: {
        x: number;
        y: number;
    }, game: CodeTiles);
    move(direction: direction): void;
}
declare class meleeUnit extends unit {
    attack(target: unit): void;
}
declare class rangedUnit extends unit {
    attack(target: unit): void;
}
declare class minerUnit extends unit {
    mine(target: tile): void;
}
declare class tile {
    type: tileType;
    position: {
        x: number;
        y: number;
    };
    constructor(type: tileType, position: {
        x: number;
        y: number;
    });
}
declare class base extends tile {
    owner: string;
    health: number;
    constructor(owner: string, position: {
        x: number;
        y: number;
    }, health: number);
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
