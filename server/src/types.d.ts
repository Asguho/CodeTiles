export type TileType = "unknown" | "ground" | "base" | "ore" | "wall";
export type Direction = "north" | "south" | "east" | "west";
export type UnitType = "melee" | "ranged" | "miner";
export interface Position {
    x: number;
    y: number;
}
export interface Unit {
    id: string;
    type: UnitType;
    owner: string;
    health: number;
    position: Position;
    actionTaken?: boolean;
}
interface standardTile {
    type: TileType;
    position: Position;
}
interface UnknownTile extends standardTile {
    type: "unknown";
}
interface GroundTile extends standardTile {
    type: "ground";
}
interface OreTile extends standardTile {
    type: "ore";
}
interface WallTile extends standardTile {
    type: "wall";
}
export interface BaseTile extends standardTile {
    type: "base";
    owner: string;
    health: number;
}
export type Tile = UnknownTile | GroundTile | OreTile | BaseTile | WallTile;
export interface TurnData {
    type: "TURN_DATA";
    map: Tile[][];
    units: Array<Unit>;
    coins: number;
    turn: number;
    basePosition: Position;
    playerId: string;
}
export type UnitAction = {
    unitId: string;
    type: string;
    direction?: string;
    target?: Position;
};
export type ShopAction = {
    type: string;
    item: string;
    quantity: number;
};
export type PlayerResponse = {
    actions: {
        units: UnitAction[];
        shop: ShopAction[];
    };
    logs?: LogEntry[];
};
export type LogEntry = {
    type: string;
    values: string[];
};
export {};
