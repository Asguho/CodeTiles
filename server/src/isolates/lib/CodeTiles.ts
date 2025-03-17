type TileType = "unknown" | "ground" | "wall" | "ore" | "base";
type UnitType = "melee" | "ranged" | "miner";
type Direction = "north" | "south" | "east" | "west";

class Unit {
    id: string;
    health: number;
    owner: string;
    type: UnitType;
    position: { x: number; y: number };
    protected codeTiles: CodeTiles;

    constructor(
        id: string,
        health: number,
        owner: string,
        type: UnitType,
        position: { x: number; y: number },
        codeTiles: CodeTiles,
    ) {
        this.id = id;
        this.health = health;
        this.owner = owner;
        this.type = type;
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
}
class MeleeUnit extends Unit {
    attack(target: Unit) {
        this.codeTiles.addAction({ 
            type: "attack",
            unitId: this.id,
            target: target.id,
        });
    }
}

class RangedUnit extends Unit {
    attack(target: Unit) {
        this.codeTiles.addAction({  
            type: "attack",
            unitId: this.id,
            target: target.id,
        });
    }
}
class MinerUnit extends Unit {
    mine(target: Tile) {
        this.codeTiles.addAction({
            type: "mine",
            unitId: this.id,
            target: target.position,
        });
    }
}

class Tile {
    type: TileType;
    position: { x: number; y: number };

    constructor(type: TileType, position: { x: number; y: number }) {
        this.type = type;
        this.position = position;
    }
}

class Base extends Tile {
    owner: string;
    health: number;

    constructor(
        owner: string,
        position: { x: number; y: number },
        health: number,
    ) {
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

class Game {
    readonly playerId: string;
    readonly map: Tile[][];
    readonly units: Unit[];
    readonly base: Base;
    readonly coins: number;
    readonly turn: number;
    readonly shop: Shop;

    constructor(gameState: any, codeTiles: CodeTiles) {
        this.playerId = gameState.playerId;
        this.map = gameState.map.map((row: any) =>
            row.map((cell: any) =>
                cell.type === "base"
                    ? new Base(cell.owner, cell.position, cell.health)
                    : new Tile(cell.type, cell.position)
            )
        );

        this.units = gameState.units.map((unitData: any) => {
            switch (unitData.type) {
                case "melee":
                    return new MeleeUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                case "ranged":
                    return new RangedUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                case "miner":
                    return new MinerUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                default:
                    return new Unit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
            }
        });
        this.base = gameState.map.find((row: any) =>
            row.find((cell: any) =>
                cell.type === "base" && cell.owner === this.playerId
            )
        );

        this.coins = gameState.coins;
        this.turn = gameState.turn;
        this.shop = new Shop(codeTiles);
    }
}

class CodeTiles {
    #game: Game;
    #actions: { units: any[]; shop: any[] } = { units: [], shop: [] };
    #logs: any[] = [];
    #playerFunction?: (game: Game) => void;

    constructor(gameState: any) {
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

    addAction(action: any) {
        if (action.type === "buy") {
            this.#actions.shop.push(action);
        } else {
            this.#actions.units.push(action);
        }
    }

    toJSON() {
        return {
            actions: this.#actions,
            logs: this.#logs,
        };
    }
    hookConsole() {
        type LogMethod = keyof Pick<
            Console,
            "log" | "error" | "warn" | "debug"
        >;
        const hookLogType = (logType: LogMethod) => {
            const original = console[logType].bind(console);
            return (...args: any[]) => {
                this.#logs.push({
                    type: logType,
                    values: Array.from(args),
                });
                original(...args);
            };
        };
        (["log", "error", "warn", "debug"] as LogMethod[]).forEach(
            (logType) => {
                console[logType] = hookLogType(logType);
            },
        );
    }
}

namespace CodeTiles {
    export function onTurn(f: (game: Game) => void): void {}
}

export { CodeTiles };