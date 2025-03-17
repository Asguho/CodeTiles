type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
type unitType = "melee" | "ranged" | "miner";
type direction = "north" | "south" | "east" | "west";

class unit {
    id: string;
    health: number;
    owner: string;
    type: unitType;
    position: { x: number; y: number };
    protected game: CodeTiles;

    constructor(
        id: string,
        health: number,
        owner: string,
        type: unitType,
        position: { x: number; y: number },
        game: CodeTiles,
    ) {
        this.id = id;
        this.health = health;
        this.owner = owner;
        this.type = type;
        this.position = position;
        this.game = game;
    }

    move(direction: direction) {
        this.game.addAction({
            type: "move",
            unitId: this.id,
            direction,
        });
    }
}
class meleeUnit extends unit {
    attack(target: unit) {
        this.game.addAction({
            type: "attack",
            unitId: this.id,
            target: target.id,
        });
    }
}

class rangedUnit extends unit {
    attack(target: unit) {
        this.game.addAction({
            type: "attack",
            unitId: this.id,
            target: target.id,
        });
    }
}
class minerUnit extends unit {
    mine(target: tile) {
        this.game.addAction({
            type: "mine",
            unitId: this.id,
            target: target.position,
        });
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

class base extends tile {
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

class shop {
    #game: CodeTiles;

    constructor(game: CodeTiles) {
        this.#game = game;
    }

    buy(item: unitType, quantity: number) {
        this.#game.addAction({
            type: "buy",
            item,
            quantity,
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
        this.map = gameState.map.map((row: any) =>
            row.map((cell: any) =>
                cell.type === "base"
                    ? new base(cell.owner, cell.position, cell.health)
                    : new tile(cell.type, cell.position)
            )
        );

        this.units = gameState.units.map((unitData: any) => {
            switch (unitData.type) {
                case "melee":
                    return new meleeUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                case "ranged":
                    return new rangedUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                case "miner":
                    return new minerUnit(
                        unitData.id,
                        unitData.health,
                        unitData.owner,
                        unitData.type,
                        unitData.position,
                        codeTiles,
                    );
                default:
                    return new unit(
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
        this.shop = new shop(codeTiles);
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
