declare module "utils" {
    export type direction = 'north' | 'south' | 'east' | 'west';
}
declare module "pathfinding" {
    import { type direction } from "utils";
    export interface Cords {
        x: number;
        y: number;
    }
    /**
     * Pathfinding utility class that implements Dijkstra's algorithm and A*
     */
    export class Pathfinding {
        private static directions;
        private static posKey;
        /**
         * Find the nearest position that satisfies the target condition
         */
        static findNearest(start: Cords, isTarget: (position: Cords) => boolean, isWalkable: (position: Cords) => boolean): Cords | null;
        /**
         * Find a path from start to end position using the A* algorithm
         * @param start Starting position
         * @param end Target position
         * @param isWalkable Function to check if a position is walkable
         * @returns Array of positions forming the path, or null if no path found
         */
        static findPath(start: Cords, end: Cords, isWalkable: (position: Cords) => boolean): direction[] | null;
        /**
         * Reconstruct the path by following the cameFrom map from end to start
         * @returns An array of direction strings ('north', 'south', 'east', 'west')
         */
        private static reconstructPath;
    }
}
declare module "CodeTiles" {
    import { type direction } from "utils";
    type tileType = 'unknown' | 'ground' | 'wall' | 'ore' | 'base';
    type unitType = 'melee' | 'ranged' | 'miner';
    class Position {
        x: number;
        y: number;
        protected game: Game;
        constructor(x: number, y: number, game: Game);
        findNearest(callback: (tile: tile) => boolean): tile | null;
    }
    class unit {
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
    class tile {
        type: tileType;
        position: Position;
        constructor(type: tileType, position: Position);
    }
    class base extends tile {
        owner: string;
        health: number;
        constructor(owner: string, position: Position, health: number);
    }
    class shop {
        #private;
        constructor(game: CodeTiles);
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
    namespace CodeTiles {
        function onTurn(f: (game: Game) => void): void;
    }
    export { CodeTiles };
}
