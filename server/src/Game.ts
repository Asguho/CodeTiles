import { socketHandler } from "./SocketHandler.ts";

type Position = {
  x: number;
  y: number;
};

type UnitAction = {
  unitId: string;
  type: string;
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
  logs?: { level: string; values: string[] }[];
};

interface Unit {
  id: string;
  type: "melee" | "ranged" | "miner";
  position: Position;
  health: number;
  owner: string; 
  actionTaken?: boolean;
}

interface Player {
  id: string;
  serverUrl: string;
  units: Unit[];
  coins: number;
  basePosition?: Position;
  mapView?: Tile[][];
  logs: { level: string; values: string[] }[];
}

interface Tile {
  type: "ground" | "wall" | "ore" | "base" | "unknown";
  x: number;
  y: number;
}
interface base extends Tile {
  type: "base";
  health: number;
  owner: string;
}

export class Game {
  players: Player[];
  map: Tile[][] = [];
  turn: number;
  mapWidth: number = 10;
  mapHeight: number = 10;

  constructor(players: { id: string; url: string }[]) {
    this.players = players.map(({ id, url }) => ({
      id,
      serverUrl: url,
      units: [],
      coins: 100,
      logs: [],
    }));
    this.turn = 0;
  }

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
      const baseX = Math.floor(Math.random() * this.mapWidth);
      const baseY = Math.floor(Math.random() * this.mapHeight);
      player.basePosition = { x: baseX, y: baseY };
      this.map[baseY][baseX] = {
        type: "base",
        health: 100,
        owner: player.id,
        x: baseX,
        y: baseY,
      } as base;
    });
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

    while (!this.isGameOver() && this.turn < 3) {
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

    let payloads = this.players.map((player) => ({
      type: "TURN_DATA",
      map: player.mapView,
      units: player.units,
      coins: player.coins,
      turn: this.turn,
      basePosition: player.basePosition,
    }));

    const playerRequests = this.players.map((player, index) =>
      this.sendRequest(player, payloads[index])
    );
    const responses = await Promise.all(playerRequests);
    console.log("responses", responses);

    responses.forEach((response, index) => {
      this.processActions(this.players[index], response);
    });

    this.players.forEach((player, index) => {
      socketHandler.sendMessage(
        player.id,
        JSON.stringify({...payloads[index], logs: player.logs}),
      );
      player.logs = []; // Clear logs after sending
    });
  }

  // Sends a POST request to the player's server with the current game state data
  async sendRequest(player: Player, payload: any): Promise<PlayerResponse> {

    try {
      const response = await fetch(player.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if(!res.ok) {
          console.error(`Error response from ${player.id}:`, res.statusText);
          return { actions: { units: [], shop: [] }, logs: [{level:"error", values: [`Backend Error: ${res.statusText}`]}] };
        }
        try {
          return await res.json();
        } catch (e: any) {
          console.log(`JSON error parsing when parsing:`, res, e);
          return { actions: { units: [], shop: [] }, logs: [{level:"error", values: [`Backend Error parsing response: ${e.message}`]}] };
        }
      });

      console.log(response.logs);
      
      player.logs = response.logs || [];
      return response;
    } catch (error) {
      console.error(`Error sending request to ${player.id}:`, error);
      return { actions: { units: [], shop: [] } };
    }
  }

  // Processes player actions ensuring unit protection and one-action-per-turn enforcement
  processActions(player: Player, response: PlayerResponse) {

    response?.actions?.units?.forEach((action) => {
      const unit = player.units.find((u) => u.id === action.unitId);

      // Validation checks
      if (!unit) return;
      if (unit.owner !== player.id) return;
      if (unit.actionTaken) return;

      // Execute the action based on type
      switch (action.type) {
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
        player.logs.push({ level: "error", values: [`SERVER: Invalid move direction: ${direction}`] });
        return;
    }
    if (
      newPos.x < 0 ||
      newPos.x >= this.mapWidth ||
      newPos.y < 0 ||
      newPos.y >= this.mapHeight
    ) {
      player.logs.push({ level: "error", values: [`SERVER: Unit ${unit.id} cannot move out of bounds.`] });
      return;
    }
    const tile = this.map[newPos.x][newPos.y];
    if (tile.type === "wall") {
      player.logs.push({ level: "error", values: [`SERVER: Unit ${unit.id} cannot move into a wall at (${newPos.x},${newPos.y}).`] });
      return;
    }
    // console.log(
    //   `Moving unit ${unit.id} from (${unit.position.x},${unit.position.y}) to (${newPos.x},${newPos.y})`,
    // );

    unit.position = newPos;
  }

  // Attacks an enemy unit at the target position
  attackWithUnit(player: Player, unit: Unit, target: Position) {
    // Ensure unit ownership
    if (unit.owner !== player.id) {
      player.logs.push({ level: "error", values: [`SERVER: Player ${player.id} is not allowed to attack with unit ${unit.id}`] });
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
    player.logs.push({ level: "error", values: [`SERVER: No enemy unit found at (${target.x},${target.y})`] });
  }

  // Mines an ore tile to collect resources
  mineResource(player: Player, unit: Unit) {
    if (unit.owner !== player.id) {
      player.logs.push({ level: "error", values: [`SERVER: Player ${player.id} is not allowed to mine with unit ${unit.id}`] });
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
      player.logs.push({ level: "error", values: [`SERVER: Unit ${unit.id} is not on an ore tile at (${pos.x},${pos.y}).`] });
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
      player.logs.push({ level: "error", values: [`SERVER: Invalid unit type: ${item}`] });
      return;
    }
    const totalCost = costPerUnit * quantity;
    if (player.coins < totalCost) {
      player.logs.push({ level: "error", values: [`SERVER: Not enough coins to buy ${quantity} ${item} unit(s).`]});
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
      player.mapView = Array(this.mapHeight).fill(null).map((_, y) =>
        Array(this.mapWidth).fill(null).map((_, x) => ({
          type: "unknown",
          x,
          y
        }))
      );

      // Vision radius for different unit types
      const visionRadius: Record<string, number> = {
        melee: 3,
        ranged: 5,
        miner: 2,
      };

      // Base vision
      if (player.basePosition && player.mapView) {
        const baseX = Math.floor(player.basePosition.x);
        const baseY = Math.floor(player.basePosition.y);
        this.revealAreaAroundPosition(player.mapView, baseX, baseY, 4);
      }

      // Reveal areas around each unit based on its vision radius
      player.units.forEach((unit) => {
        const radius = visionRadius[unit.type] || 3;
        if (player.mapView) {
          this.revealAreaAroundPosition(
            player.mapView,
            Math.floor(unit.position.x),
            Math.floor(unit.position.y),
            radius,
          );
        }
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
