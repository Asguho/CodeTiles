import { socketHandler } from "./SocketHandler.ts";

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

export class Game {
  players: Player[];
  turn: number;
  map: Tile[][] = [];
  mapWidth: number = 10;
  mapHeight: number = 10;

  constructor(players: { id: string; url: string }[]) {
    this.players = players.map(({ id, url }) => ({
      id,
      serverUrl: url,
      mapView: {},
      units: [],
      coins: 100,
    }));
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
    this.players.forEach((player) => {
      player.basePosition = {
        x: Math.floor(Math.random() * this.mapWidth),
        y: Math.floor(Math.random() * this.mapHeight),
      };
    });
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

  async start() {
    this.generateMap();

    while (!this.isGameOver()) {
      this.resetUnitActions();
      await this.processTurn();
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

    // Update what each player can see
    this.updatePlayerMapView();

    const playerRequests = this.players.map((player) =>
      this.sendRequest(player)
    );
    const responses = await Promise.all(playerRequests);
    console.log("responses", responses);

    responses.forEach((response, index) => {
      this.processActions(this.players[index], response);
    });
    
    
    this.printMap();
    alert("Turn " + this.turn + " complete. press enter to continue");
  }

  // Sends a POST request to the player's server with the current game state data
  async sendRequest(player: Player): Promise<PlayerResponse> {
    const payload = {
      map: player.mapView,
      units: player.units,
      coins: player.coins,
    };

    socketHandler.sendMessage(player.id, JSON.stringify(payload));

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
    // Process unit actions
    response?.actions?.units?.forEach((action) => {
      const unit = player.units.find((u) => u.id === action.unitId);

      // Validation checks
      if (!unit) return;
      if (unit.owner !== player.id) return;
      if (unit.actionTaken) return;

      // Execute the action based on type
      switch (action.action) {
        case "move":
          this.moveUnit(player, unit, action.direction!);
          break;
        case "attack":
          this.attackWithUnit(player, unit, action.target!);
          break;
        case "mine":
          this.mineResource(player, unit);
          break;
      }

      unit.actionTaken = true;
    });

    // Process shop actions
    response?.actions?.shop?.forEach((order) => {
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
        id: crypto.randomUUID(),
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

  // Updates each player's map view with fog of war
  updatePlayerMapView() {
    // Reset each player's map view first
    this.players.forEach((player) => {
      // Initialize empty map with fog of war (all unknown)
      player.mapView = Array(this.mapHeight).fill(null).map(() =>
        Array(this.mapWidth).fill(null).map(() => ({
          type: "unknown",
        }))
      );

      // Vision radius for different unit types
      const visionRadius: Record<string, number> = {
        melee: 3,
        ranged: 5,
        miner: 2,
      };

      // Base vision
      if (player.basePosition) {
        const baseX = Math.floor(player.basePosition.x);
        const baseY = Math.floor(player.basePosition.y);
        this.revealAreaAroundPosition(player.mapView, baseX, baseY, 4);
      }

      // Reveal areas around each unit based on its vision radius
      player.units.forEach((unit) => {
        const radius = visionRadius[unit.type] || 3;
        this.revealAreaAroundPosition(
          player.mapView,
          Math.floor(unit.position.x),
          Math.floor(unit.position.y),
          radius,
        );
      });
    });
  }

  // Helper method to reveal an area on the map around a position
  private revealAreaAroundPosition(
    mapView: any[][],
    centerX: number,
    centerY: number,
    radius: number,
  ) {
    for (
      let y = Math.max(0, centerY - radius);
      y <= Math.min(this.mapHeight - 1, centerY + radius);
      y++
    ) {
      for (
        let x = Math.max(0, centerX - radius);
        x <= Math.min(this.mapWidth - 1, centerX + radius);
        x++
      ) {
        // Calculate distance to check if within radius
        const distance = Math.sqrt(
          Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2),
        );
        if (distance <= radius) {
          // Reveal this tile on the map view
          const tile = this.map[y][x];
          mapView[y][x] = {
            type: tile.type,
            x: x,
            y: y,
          };

          // Check for units at this position and add them to the map view
          for (const player of this.players) {
            const unitsAtPos = player.units.filter((u) =>
              Math.floor(u.position.x) === x && Math.floor(u.position.y) === y
            );

            if (unitsAtPos.length > 0) {
              mapView[y][x].units = unitsAtPos.map((u) => ({
                id: u.id,
                type: u.type,
                owner: u.owner,
                health: u.health,
              }));
            }
          }

          // Check for bases at this position
          for (const player of this.players) {
            if (
              player.basePosition &&
              Math.floor(player.basePosition.x) === x &&
              Math.floor(player.basePosition.y) === y
            ) {
              mapView[y][x].base = {
                owner: player.id,
              };
            }
          }
        }
      }
    }
  }
}
