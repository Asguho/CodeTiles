type tileType = 'unknown' | 'ground' | 'wall' | 'ore';
type unitType = 'melee' | 'ranged' | 'miner';
type direction = 'north' | 'south' | 'east' | 'west';

class unit {
    id: string;
    health: number;
    type: unitType;
    position: { x: number; y: number };
    protected game?: CodeTiles;

    constructor(id: string, health: number, type: unitType, position: { x: number; y: number }, game?: CodeTiles) {
        this.id = id;
        this.health = health;
        this.type = type;
        this.position = position;
        this.game = game;
    }

    move(direction: direction) {
        if (this.game) {
            this.game.addAction({
                type: 'move',
                unitId: this.id,
                direction
            });
        }
    }
}
class meleeUnit extends unit {
    attack(target: unit) {
        if (this.game) {
            this.game.addAction({
                type: 'attack',
                unitId: this.id,
                target: target.id
            });
        }
    }
}

class rangedUnit extends unit {
    attack(target: unit) {
        if (this.game) {
            this.game.addAction({
                type: 'attack',
                unitId: this.id,
                target: target.id
            });
        }
    }
}
class minerUnit extends unit {
    mine(target: tile) {
        if (this.game) {
            this.game.addAction({
                type: 'mine',
                unitId: this.id,
                target: target.position
            });
        }
    }
}

class tile {
    type: tileType;
    position: { x: number; y: number };

    constructor(type: tileType, position: { x: number; y: number }) {
        this.type = type;
        this.position = position;
    }
}

class base {
    id: string;
    owner: string;
    position: { x: number; y: number };
    health: number;
    constructor(id: string, owner: string, position: { x: number; y: number }, health: number) {
        this.id = id;
        this.owner = owner;
        this.position = position;
        this.health = health;
    }
}

class shop {
    game?: CodeTiles;

    constructor(game?: CodeTiles) {
        this.game = game;
    }

    buy(item: unitType, quantity: number) {
        if (this.game) {
            this.game.addAction({
                type: 'buy',
                item,
                quantity
            });
        }
    }
}

export class CodeTiles {
    readonly map: tile[][];
    readonly units: unit[];
    readonly bases: base[];
    readonly coins: number;
    readonly turn: number;
    readonly shop: shop;
    #actions: { units: any[], shop: any[] } = { units: [], shop: [] };
    #logs: any[] = [];

    constructor(gameState: any) {
        this.map = gameState.map.map((row: any) => row.map((cell: any) => new tile(cell.type, cell.position)));
        this.units = gameState.units.map((unitData: any) => {
            switch(unitData.type) {
                case 'melee':
                    return new meleeUnit(unitData.id, unitData.health, unitData.type, unitData.position, this);
                case 'ranged':
                    return new rangedUnit(unitData.id, unitData.health, unitData.type, unitData.position, this);
                case 'miner':
                    return new minerUnit(unitData.id, unitData.health, unitData.type, unitData.position, this);
                default:
                    return new unit(unitData.id, unitData.health, unitData.type, unitData.position, this);
            }
        });
        this.bases = gameState.bases.map((base: any) => new base(base.id, base.owner, base.position, base.health));
        this.coins = gameState.coins;
        this.turn = gameState.turn;
        this.shop = new shop(this);
        this.hookConsole();
    }

    addAction(action: any) {
        if (action.type === 'buy') {
            this.#actions.shop.push(action);
        } else {
            this.#actions.units.push(action);
        }
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
    
    toJSON() {
        return {
            actions: this.#actions,
            logs: this.#logs
        };
    }
}

let codeTiles = new CodeTiles({
    map: [
        [{ type: "grass" }, { type: "grass" }, { type: "grass" }],
        [{ type: "grass" }, { type: "grass" }, { type: "grass" }],
        [{ type: "grass" }, { type: "grass" }, { type: "grass" }]
    ],  
    units: [
        { id: "unit1", health: 100, type: "melee", position: { x: 0, y: 0 } },
        { id: "unit2", health: 100, type: "ranged", position: { x: 1, y: 1 } }
    ],
    bases: [
        { id: "base1", owner: "player1", position: { x: 0, y: 0 }, health: 100 },
        { id: "base2", owner: "player2", position: { x: 1, y: 1 }, health: 100 }
    ],
    coins: 100,
    turn: 1
});

// Now you can use specific unit methods
// codeTiles.units.forEach(unit => {
//     unit.move("north");
//     if (unit.type === "melee" || unit.type === "ranged") {
//         (unit as meleeUnit | rangedUnit).attack(codeTiles.units[0]);
//     }
// });
// codeTiles.shop.buy("melee", 2);