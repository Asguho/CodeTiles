export type TileType = "unknown" | "ground" | "base" | "ore" | "wall";
export type Direction = "north" | "south" | "east" | "west";
export type UnitType = "melee" | "ranged" | "miner";
export interface GameSettings {
  map: {
    width: number;
    height: number;
  };
  maxTurns: number;
  fogOfWar: boolean;
  unit: {
    [key: string]: {
      health: number;
      attack: number;
      range: number;
      price: number;
      damage?: number;
    };
  };
}
// Position interface
export interface Position {
  x: number;
  y: number;
}

// Unit interface
export interface Unit {
  id: string;
  type: UnitType;
  owner: string;
  health: number;
  position: Position;
  actionTaken?: boolean;
}

export interface Miner extends Unit {
  type: "miner";
  inventory: {
    ore: number;
  };
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

// Union type for all tile types
export type Tile = UnknownTile | GroundTile | OreTile | BaseTile | WallTile;

// Main game state interface
export interface TurnData {
  type: "TURN_DATA";
  gameId: string;
  gameSettings: GameSettings;
  map: Tile[][];
  units: Array<Unit>;
  coins: number;
  turn: number;
  basePosition: Position;
  playerId: string;
}

export interface TurnDataWithLogs extends TurnData {
  logs: LogEntry[];
}

/// client to server message types
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

export type LogEntry = { type: string; values: string[] };
