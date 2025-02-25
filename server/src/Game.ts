import * as uuid from "jsr:@std/uuid";

type Position = {
  x: number;
  y: number;
};

type UnitAction = {
  unitId: string;
  action: string;
  direction?: string;
  target?: Position;
};

type ShopAction = {
  type: string;
  item: string;
  quantity: number;
};

type PlayerResponse = {
  actions: {
    units: UnitAction[];
    shop: ShopAction[];
  };
};

interface Unit {
  id: string;
  type: "melee" | "ranged" | "miner";
  position: Position;
  health: number;
  owner: string; // Owner's player id
  actionTaken?: boolean; // Flag to limit one action per turn
  // ...other unit properties...
}

interface Player {
  id: string;
  serverUrl: string;
  mapView: any; // Represents the part of the map visible to the player
  units: Unit[];
  coins: number;
  basePosition?: Position; // Base for spawning new units
}

interface Tile {
  type: "ground" | "wall" | "ore";
  x: number;
  y: number;
}

class Game {
  players: Player[];
  turn: number;
  map: Tile[][] = [];
  mapWidth: number = 10;
  mapHeight: number = 10;

  constructor(players: Player[]) {
    this.players = players;
    this.turn = 0;
  }

  // Generates a simple tile-based map
  generateMap() {
    for (let y = 0; y < this.mapHeight; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        let rand = Math.random();
        let type: Tile["type"] = "ground";
        if (rand < 0.1) {
          type = "wall";
        } else if (rand < 0.2) {
          type = "ore";
        }
        row.push({ x, y, type });
      }
      this.map.push(row);
    }
    console.log("Map generated");
  }

  // Resets units' actionTaken flag for each turn
  resetUnitActions() {
    this.players.forEach((player) => {
      player.units.forEach((unit) => {
        unit.actionTaken = false;
      });
    });
  }

  // Starts the game loop
  async start() {
    // Generate the game map
    this.generateMap();
    // Initialize each player's base position if not provided
    this.players.forEach((player) => {
      if (!player.basePosition && player.units.length > 0) {
        player.basePosition = { ...player.units[0].position };
      }
      // Update player's mapView (implement FOG logic as needed)
      player.mapView = this.map;
    });

    while (!this.isGameOver()) {
      // Reset units' actions at beginning of each turn
      this.resetUnitActions();
      await this.processTurn();
      // Optional delay: await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("Game Over");
  }

  // Game over logic can be implemented here
  isGameOver(): boolean {
    return false;
  }

  // Process a single turn for all players by sending requests and processing their responses
  async processTurn() {
    this.turn++;
    console.log(`Starting turn ${this.turn}`);

    const playerRequests = this.players.map((player) =>
      this.sendRequest(player)
    );
    const responses = await Promise.all(playerRequests);

    responses.forEach((response, index) => {
      this.processActions(this.players[index], response);
    });
  }

  // Sends a POST request to the player's server with the current game state data
  async sendRequest(player: Player): Promise<PlayerResponse> {
    const payload = {
      map: player.mapView,
      units: player.units,
      coins: player.coins,
    };

    try {
      const response = await fetch(player.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error sending request to ${player.id}:`, error);
      return { actions: { units: [], shop: [] } };
    }
  }

  // Processes player actions ensuring unit protection and one-action-per-turn enforcement
  processActions(player: Player, response: PlayerResponse) {
    response.actions.units.forEach((action) => {
      console.log(
        `Player ${player.id} - Processing action for unit ${action.unitId}:`,
        action,
      );
      const unit = player.units.find((u) => u.id === action.unitId);
      if (!unit) {
        console.log(`Unit ${action.unitId} not found for player ${player.id}`);
        return;
      }
      if (unit.owner !== player.id) {
        console.log(
          `Player ${player.id} is not allowed to control unit ${unit.id}`,
        );
        return;
      }
      if (unit.actionTaken) {
        console.log(`Unit ${unit.id} has already taken an action this turn`);
        return;
      }
      // Process action and mark the unit so it cannot act again this turn
      if (action.action === "move" && action.direction) {
        this.moveUnit(player, unit, action.direction);
      }
      if (action.action === "attack" && action.target) {
        this.attackWithUnit(player, unit, action.target);
      }
      if (action.action === "mine") {
        this.mineResource(player, unit);
      }
      unit.actionTaken = true;
    });

    response.actions.shop.forEach((order) => {
      console.log(`Player ${player.id} - Processing shop order:`, order);
      if (order.type === "buy") {
        this.buyUnit(player, order.item, order.quantity);
      }
    });
  }

  // Moves a unit in the specified direction
  moveUnit(player: Player, unit: Unit, direction: string) {
    let newPos = { ...unit.position };
    switch (direction.toLowerCase()) {
      case "north":
        newPos.y -= 1;
        break;
      case "south":
        newPos.y += 1;
        break;
      case "east":
        newPos.x += 1;
        break;
      case "west":
        newPos.x -= 1;
        break;
      default:
        console.log(`Invalid direction ${direction}`);
        return;
    }
    if (
      newPos.x < 0 ||
      newPos.x >= this.mapWidth ||
      newPos.y < 0 ||
      newPos.y >= this.mapHeight
    ) {
      console.log(`Unit ${unit.id} cannot move out of bounds.`);
      return;
    }
    const tile = this.map[newPos.y][newPos.x];
    if (tile.type === "wall") {
      console.log(
        `Unit ${unit.id} cannot move into a wall at (${newPos.x},${newPos.y}).`,
      );
      return;
    }
    console.log(
      `Moving unit ${unit.id} from (${unit.position.x},${unit.position.y}) to (${newPos.x},${newPos.y})`,
    );
    unit.position = newPos;
  }

  // Attacks an enemy unit at the target position
  attackWithUnit(player: Player, unit: Unit, target: Position) {
    // Ensure unit ownership
    if (unit.owner !== player.id) {
      console.log(
        `Player ${player.id} is not allowed to attack with unit ${unit.id}`,
      );
      return;
    }
    for (const enemy of this.players.filter((p) => p.id !== player.id)) {
      const targetUnit = enemy.units.find(
        (u) => u.position.x === target.x && u.position.y === target.y,
      );
      if (targetUnit) {
        let damage = unit.type === "melee" ? 20 : 15;
        console.log(
          `Unit ${unit.id} (${unit.type}) attacks enemy unit ${targetUnit.id} for ${damage} damage`,
        );
        targetUnit.health -= damage;
        if (targetUnit.health <= 0) {
          console.log(`Enemy unit ${targetUnit.id} has been defeated`);
          enemy.units = enemy.units.filter((u) => u.id !== targetUnit.id);
        }
        return;
      }
    }
    console.log(
      `No enemy unit found at (${target.x}, ${target.y}) for unit ${unit.id} to attack.`,
    );
  }

  // Mines an ore tile to collect resources
  mineResource(player: Player, unit: Unit) {
    if (unit.owner !== player.id) {
      console.log(
        `Player ${player.id} is not allowed to mine with unit ${unit.id}`,
      );
      return;
    }
    const pos = unit.position;
    const tile = this.map[pos.y][pos.x];
    if (tile.type === "ore") {
      console.log(
        `Miner unit ${unit.id} is mining at (${pos.x},${pos.y}). Resources collected!`,
      );
      player.coins += 20;
      tile.type = "ground";
    } else {
      console.log(`Miner unit ${unit.id} is not on an ore tile.`);
    }
  }

  // Purchases new units if the player has enough coins
  buyUnit(player: Player, item: string, quantity: number) {
    const costs: Record<string, number> = {
      melee: 50,
      ranged: 60,
      miner: 40,
    };
    const costPerUnit = costs[item];
    if (!costPerUnit) {
      console.log(`Invalid unit type: ${item}`);
      return;
    }
    const totalCost = costPerUnit * quantity;
    if (player.coins < totalCost) {
      console.log(
        `Player ${player.id} does not have enough coins to buy ${quantity} ${item} units.`,
      );
      return;
    }
    player.coins -= totalCost;
    console.log(
      `Player ${player.id} bought ${quantity} ${item} unit(s) for ${totalCost} coins.`,
    );
    for (let i = 0; i < quantity; i++) {
      const newUnit: Unit = {
        id: uuid.v4(),
        type: item as "melee" | "ranged" | "miner",
        position: player.basePosition
          ? { ...player.basePosition }
          : { x: 0, y: 0 },
        health: item === "ranged" ? 80 : 100,
        owner: player.id,
        actionTaken: false,
      };
      player.units.push(newUnit);
    }
  }
}

// Sample usage:
const players: Player[] = [
  {
    id: "player1",
    serverUrl: "http://localhost:3001",
    mapView: {},
    units: [
      {
        id: "unit-1",
        type: "melee",
        position: { x: 0, y: 0 },
        health: 100,
        owner: "player1",
        actionTaken: false,
      },
      {
        id: "unit-2",
        type: "ranged",
        position: { x: 1, y: 0 },
        health: 80,
        owner: "player1",
        actionTaken: false,
      },
      {
        id: "unit-3",
        type: "miner",
        position: { x: 0, y: 1 },
        health: 60,
        owner: "player1",
        actionTaken: false,
      },
    ],
    coins: 100,
    basePosition: { x: 0, y: 0 },
  },
  // ... Initialize additional players as needed ...
];

const game = new Game(players);
game.start();
