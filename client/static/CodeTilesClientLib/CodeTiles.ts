import { type direction } from './utils.ts';
import { Pathfinding,  type Cords } from './pathfinding';

type tileType = 'unknown' | 'ground' | 'wall' | 'ore' | 'base';
type unitType = 'melee' | 'ranged' | 'miner';



// Position class with findNearest utility
class Position {
    x: number;
    y: number;
    protected game: Game;

    constructor(x: number, y: number, game: Game) {
        this.x = x;
        this.y = y;
        this.game = game;
    }

    // Find nearest tile that satisfies the condition
    findNearest(callback: (tile: tile) => boolean): tile | null {
        // Check if the current position already satisfies the condition
        const currentTile = this.game.map[this.y][this.x];
        if (callback(currentTile)) {
            return currentTile;
        }
        
        // Define walkable function - a position is walkable if it's within map bounds 
        // and not a wall (can be customized based on game rules)
        const isWalkable = (pos: Cords): boolean => {
            const x = pos.x;
            const y = pos.y;
            if (x < 0 || y < 0 || y >= this.game!.map.length || x >= this.game!.map[0].length) {
                return false;
            }
            return this.game.map[y][x].type !== 'wall';
        };

        const isTarget = (pos: Cords): boolean => {
            const tile = this.game.map[pos.y][pos.x];
            return callback(tile);
        };        

        // Find the nearest position that satisfies the target condition
        const nearestPos = Pathfinding.findNearest(this, isTarget, isWalkable);
        
        // Return the corresponding tile or null if not found
        if (nearestPos) {
            return this.game.map[nearestPos.y][nearestPos.x];
        }
        return null;
    }
}

class unit {
    id: string;
    health: number;
    owner: string;
    type: unitType;
    position: Position;
    protected codeTiles: CodeTiles;

    constructor(id: string, health: number, owner: string, type: unitType, position: Position, codeTiles: CodeTiles) {
        this.id = id;
        this.health = health;
        this.owner = owner;
        this.type = type;
        this.position = position;
        this.codeTiles = codeTiles;
    }

    move(direction: direction) {
        this.codeTiles.addAction({
            type: 'move',
            unitId: this.id,
            direction
        });
    }

    moveTowards(target: Position) {
        const isWalkable = (pos: Cords): boolean => {
            const x = pos.x;
            const y = pos.y;
            if (x < 0 || y < 0 || y >= this.codeTiles.game.map.length || x >= this.codeTiles.game.map[0].length) {
                return false;
            }
            return this.codeTiles.game.map[y][x].type !== 'wall';
        };


        const path = Pathfinding.findPath(this.position, target, isWalkable)
        if (path && path.length > 0) {
            this.move(path[0]);
        } else {
            console.log('No valid path found to target position.');
        }
    }

}
class meleeUnit extends unit {
    attack(target: unit) {
            this.codeTiles.addAction({
                type: 'attack',
                unitId: this.id,
                target: target.id
            });
        }
}

class rangedUnit extends unit {
    attack(target: unit) {
            this.codeTiles.addAction({
                type: 'attack',
                unitId: this.id,
                target: target.id
            });
    }
}
class minerUnit extends unit {
    mine(target: tile) {
            this.codeTiles.addAction({
                type: 'mine',
                unitId: this.id,
                target: target.position
            });
    }
}

class tile {
    type: tileType;
    position: Position;

    constructor(type: tileType, position: Position) {
        this.type = type;
        this.position = position;
    }
}

class base extends tile {
    owner: string;
    health: number;
    
    constructor(owner: string, position: Position, health: number) {
        super('base', position);
        this.owner = owner;
        this.health = health;
    }
}

class shop {
    #game: CodeTiles;

    constructor(game: CodeTiles) {
        this.#game = game;
    }

    buy(item: unitType, quantity: number) {
        this.#game.addAction({
            type: 'buy',
            item,
            quantity
        });
    }
}

class Game {
    readonly playerId: string;
    readonly map: tile[][];
    readonly units: unit[];
    readonly base: base;
    readonly coins: number;
    readonly turn: number;
    readonly shop: shop;

    constructor(gameState: any, codeTiles: CodeTiles) {
        this.playerId = gameState.playerId;
        
        // Create map with tiles and positions
        this.map = gameState.map.map((row: any, y: number) => 
            row.map((cell: any, x: number) => {
                // Create tile instance
                const position = new Position(x, y, this);
                const tileInstance = cell.type === 'base' 
                    ? new base(cell.owner, position, cell.health) 
                    : new tile(cell.type, position);
                
                return tileInstance;
            })
        );
        

        
        // Create unit instances
        this.units = gameState.units.map((unitData: any) => {
            switch(unitData.type) {
                case 'melee':
                    return new meleeUnit(unitData.id, unitData.health, unitData.owner, unitData.type, unitData.position, codeTiles);
                case 'ranged':
                    return new rangedUnit(unitData.id, unitData.health, unitData.owner, unitData.type, unitData.position, codeTiles);
                case 'miner':
                    return new minerUnit(unitData.id, unitData.health, unitData.owner, unitData.type, unitData.position, codeTiles);
                default:
                    return new unit(unitData.id, unitData.health, unitData.owner, unitData.type, unitData.position, codeTiles);
            }
        });
        
        // Find base
        this.base = this.map.flat().find(cell => 
            cell.type === 'base' && (cell as base).owner === this.playerId
        ) as base;
        
        this.coins = gameState.coins;
        this.turn = gameState.turn;
        this.shop = new shop(codeTiles);
    }   
}


class CodeTiles {
    game: Game;
    #actions: { units: any[], shop: any[] } = { units: [], shop: [] };
    #logs: any[] = [];
    #playerFunction?: (game: Game) => void;

    constructor(gameState: any) {
        this.game = new Game(gameState, this);
        this.hookConsole();
    }

    onTurn(f: (game: Game) => void) { this.#playerFunction = f; }

    evaluate() {
        if (this.#playerFunction) {
            this.#playerFunction(this.game);
        }
    }
    
    addAction(action: any) {
        if (action.type === 'buy') {
            this.#actions.shop.push(action);
        } else {
            this.#actions.units.push(action);
        }
    }
    
    toJSON() {
        return {
            actions: this.#actions,
            logs: this.#logs
        };
    }
    hookConsole() {
        type LogMethod = keyof Pick<Console, 'log' | 'error' | 'warn' | 'debug'>;
        const hookLogType = (logType: LogMethod) => {
            const original = console[logType].bind(console);
            return (...args: any[]) => {
                this.#logs.push({ 
                    type: logType, 
                    values: Array.from(args)
                });
                original(...args);
            };
        };
        (['log', 'error', 'warn', 'debug'] as LogMethod[]).forEach(logType => {
            console[logType] = hookLogType(logType);
        });
    } 
}

namespace CodeTiles {
    export function onTurn(f: (game: Game) => void): void {}
}

export { CodeTiles }