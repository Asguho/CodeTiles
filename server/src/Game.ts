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
        // Create random walls and ore tiles; others are ground
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

  // This method starts the game loop
  async start() {
    // Generate the game map
    this.generateMap();
    // Optionally initialize each player's base position if not provided (using first unit's position)
    this.players.forEach((player) => {
      if (!player.basePosition && player.units.length > 0) {
        player.basePosition = { ...player.units[0].position };
      }
      // Update player's mapView to be a subset of the full map (implement FOG logic as needed)
      player.mapView = this.map;
    });

    while (!this.isGameOver()) {
      await this.processTurn();
      // Optionally add a delay between turns if necessary, e.g.,
      // await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("Game Over");
  }

  // Checks if the game is over (for example, a base has been captured)
  isGameOver(): boolean {
    // Game over logic goes here.
    // For now, we return false to run an infinite loop.
    return false;
  }

  // Processes a single turn by sending requests to each player's server and processing their responses
  async processTurn() {
    this.turn++;
    console.log(`Starting turn ${this.turn}`);

    // Send a request to each player's server concurrently
    const playerRequests = this.players.map((player) =>
      this.sendRequest(player)
    );
    const responses = await Promise.all(playerRequests);

    // Process each player's actions
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error sending request to ${player.id}:`, error);
      // Return empty actions to avoid breaking the game loop
      return { actions: { units: [], shop: [] } };
    }
  }

  // Processes the actions returned from the player's server
  processActions(player: Player, response: PlayerResponse) {
    // Process unit actions such as movement and attack
    response.actions.units.forEach((action) => {
      console.log(
        `Player ${player.id} - Processing action for unit ${action.unitId}:`,
        action,
      );

      if (action.action === "move" && action.direction) {
        this.moveUnit(player, action.unitId, action.direction);
      }
      if (action.action === "attack" && action.target) {
        this.attackWithUnit(player, action.unitId, action.target);
      }
      if (action.action === "mine") {
        this.mineResource(player, action.unitId);
      }
    });

    // Process shop actions to purchase new units or items
    response.actions.shop.forEach((order) => {
      console.log(`Player ${player.id} - Processing shop order:`, order);
      if (order.type === "buy") {
        this.buyUnit(player, order.item, order.quantity);
      }
    });
  }

  // Moves a unit in the specified direction if possible
  moveUnit(player: Player, unitId: string, direction: string) {
    const unit = player.units.find((u) => u.id === unitId);
    if (!unit) return;
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
    // Validate boundaries
    if (
      newPos.x < 0 ||
      newPos.x >= this.mapWidth ||
      newPos.y < 0 ||
      newPos.y >= this.mapHeight
    ) {
      console.log(`Unit ${unit.id} cannot move out of bounds.`);
      return;
    }
    // Check if the tile is passable (should not be a wall)
    const tile = this.map[newPos.y][newPos.x];
    if (tile.type === "wall") {
      console.log(
        `Unit ${unit.id} cannot move into a wall at (${newPos.x},${newPos.y}).`,
      );
      return;
    }
    // Move unit
    console.log(
      `Moving unit ${unit.id} from (${unit.position.x},${unit.position.y}) to (${newPos.x},${newPos.y})`,
    );
    unit.position = newPos;
  }

  // Simulates an attack from a unit towards a target position. If an enemy unit is found at the target, apply damage.
  attackWithUnit(player: Player, unitId: string, target: Position) {
    const attacker = player.units.find((u) => u.id === unitId);
    if (!attacker) return;

    // Search through enemy players for a unit at that position
    for (const enemy of this.players.filter((p) => p.id !== player.id)) {
      const targetUnit = enemy.units.find((u) =>
        u.position.x === target.x && u.position.y === target.y
      );
      if (targetUnit) {
        // Apply damage based on unit type
        let damage = attacker.type === "melee" ? 20 : 15;
        console.log(
          `Unit ${attacker.id} (${attacker.type}) attacks enemy unit ${targetUnit.id} for ${damage} damage`,
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
      `No enemy unit found at (${target.x}, ${target.y}) for unit ${attacker.id} to attack.`,
    );
  }

  // Simulates mining action for miner units
  mineResource(player: Player, unitId: string) {
    const miner = player.units.find((u) =>
      u.id === unitId && u.type === "miner"
    );
    if (!miner) {
      console.log(`Unit ${unitId} is not a miner or not found.`);
      return;
    }
    // Check if the miner is on an ore tile
    const pos = miner.position;
    const tile = this.map[pos.y][pos.x];
    if (tile.type === "ore") {
      console.log(
        `Miner unit ${miner.id} is mining at (${pos.x},${pos.y}). Resources collected!`,
      );
      // Increase player's coins (or other resource logic)
      player.coins += 20;
      // Update the tile to ground once mined
      tile.type = "ground";
    } else {
      console.log(`Miner unit ${miner.id} is not on an ore tile.`);
    }
  }

  // Purchases a new unit if the player has enough coins.
  buyUnit(player: Player, item: string, quantity: number) {
    // Define coin cost for each unit type
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

    // Spawn new units at player's base position
    for (let i = 0; i < quantity; i++) {
      const newUnit: Unit = {
        id: `unit-${Date.now()}-${i}`,
        type: item as "melee" | "ranged" | "miner",
        position: player.basePosition
          ? { ...player.basePosition }
          : { x: 0, y: 0 },
        health: item === "ranged" ? 80 : 100,
      };
      player.units.push(newUnit);
    }
  }
}

// Sample usage:
const players: Player[] = [
  {
    id: "player1",
    serverUrl: "http://localhost:3001", // Player's server endpoint
    mapView: {}, // This will be set in start()
    units: [
      { id: "unit-1", type: "melee", position: { x: 0, y: 0 }, health: 100 },
      { id: "unit-2", type: "ranged", position: { x: 1, y: 0 }, health: 80 },
      { id: "unit-3", type: "miner", position: { x: 0, y: 1 }, health: 60 },
    ],
    coins: 100,
    basePosition: { x: 0, y: 0 },
  },
  // ...Initialize additional players as needed...
];

const game = new Game(players);
game.start();
