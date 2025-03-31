import { socketHandler } from "./SocketHandler.ts";
import type { GameSettings, Miner, PlayerResponse, Position, Tile, TurnData, Unit } from "./types.ts";

interface Player {
  id: string;
  serverUrl: string;
  units: Unit[];
  coins: number;
  basePosition?: Position;
  mapView?: Tile[][];
  logs: { type: string; values: string[] }[];
}

export class Game {
  players: Player[];
  map: Tile[][] = [];
  turn: number = 0;
  mapWidth: number = 10;
  mapHeight: number = 10;
  lossers: string[] = [];
  isFogOfWar: boolean = false;
  gameSettings: GameSettings;
  constructor(players: { id: string; url: string }[], gameSettings: GameSettings, private cleanUp: (outCome: string[] | null) => void) {
    this.players = players.map(({ id, url }) => ({
      id,
      serverUrl: url,
      units: [],
      coins: 100,
      logs: [],
    }));
    this.gameSettings = gameSettings;
  }

  generateMap() {
    for (let y = 0; y < this.gameSettings.map.height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < this.gameSettings.map.width; x++) {
        const rand = Math.random();
        let type: Tile["type"] = "ground";
        if (rand < 0.1) {
          type = "wall";
        } else if (rand < 0.2) {
          type = "ore";
        }
        row.push({ position: { x, y }, type });
      }
      this.map.push(row);
    }
    this.players.forEach((player) => {
      const baseX = Math.floor(Math.random() * this.gameSettings.map.width);
      const baseY = Math.floor(Math.random() * this.gameSettings.map.height);
      player.basePosition = { x: baseX, y: baseY };
      this.map[baseY][baseX] = {
        type: "base",
        health: 100,
        owner: player.id,
        position: { x: baseX, y: baseY },
      };
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

    const sendMapToPlayers = (customLog: string) => {
      this.updatePlayerMapView();
      this.players.forEach((player) => {
        player.logs.push({ type: "log", values: [customLog] });
        socketHandler.sendMessage(
          player.id,
          JSON.stringify(this.createPayload(player)),
        );
        player.logs = [];
      });
    };
    while (true) {
      if (this.isGameOver()) {
        const winner = this.players.find((player) => player.basePosition);
        sendMapToPlayers(`Game Over. the winner was ${winner?.id}`);

        this.players.forEach((player) => {
          socketHandler.sendMessage(
            player.id,
            JSON.stringify({
              type: "GAME_OVER",
              winner: winner?.id,
            }),
          );
        });
        console.log(`Game Over. the winner was ${winner?.id}. the losers were ${this.lossers}`);
        this.cleanUp([winner!.id, ...this.lossers]);
        break;
      }
      if (this.turn > 25) {
        sendMapToPlayers("Game over due to time limit.");
        this.players.forEach((player) => {
          socketHandler.sendMessage(
            player.id,
            JSON.stringify({
              type: "GAME_OVER",
              winner: null,
            }),
          );
        });
        this.cleanUp(null);
        console.log("Game over due to time limit.");
        break;
      }

      this.resetUnitActions();
      await this.processTurn();
    }
  }

  // Game over logic can be implemented here
  isGameOver(): boolean {
    return this.players.filter((player) => player.basePosition).length <= 1;
  }
  createPayload(player: Player): TurnData {
    return {
      type: "TURN_DATA",
      gameSettings: this.gameSettings,
      playerId: player.id,
      map: player.mapView || [],
      units: this.players.flatMap((p) => p.units),
      coins: player.coins,
      turn: this.turn,
      basePosition: player.basePosition!,
    };
  }

  // Process a single turn for all players by sending requests and processing their responses
  async processTurn() {
    this.turn++;
    console.log(`Starting turn ${this.turn}`);

    // Update what each player can see
    this.updatePlayerMapView();

    const payloads: TurnData[] = this.players.map((player) => this.createPayload(player));

    this.players.forEach((player, index) => {
      socketHandler.sendMessage(
        player.id,
        JSON.stringify({ ...payloads[index], logs: player.logs }),
      );
      player.logs = []; // Clear logs after sending
    });

    const playerRequests = this.players.map((player, index) =>
      player.basePosition ? this.sendRequest(player, payloads[index]) : Promise.resolve({ actions: { units: [], shop: [] } })
    );
    const responses = await Promise.all(playerRequests);
    responses.forEach((response, index) => {
      if (!this.players[index].basePosition) {
        return;
      }
      this.processActions(this.players[index], response);
    });
  }

  // Sends a POST request to the player's server with the current game state data
  async sendRequest(player: Player, payload: TurnData): Promise<PlayerResponse> {
    try {
      const response = await fetch(player.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          console.error(`Error response from ${player.id}:`, res.statusText);
          return {
            actions: { units: [], shop: [] },
            logs: [{
              type: "error",
              values: [`Backend Error: ${res.statusText}`],
            }],
          };
        }
        try {
          return await res.json();
          // deno-lint-ignore no-explicit-any
        } catch (e: any) {
          console.log(`JSON error parsing when parsing:`, res, e);
          return {
            actions: { units: [], shop: [] },
            logs: [{
              type: "error",
              values: [`Backend Error parsing response: ${e.message}`],
            }],
          };
        }
      });

      // console.log(response.logs);

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
    const newPos = { ...unit.position };
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
        player.logs.push({
          type: "error",
          values: [`SERVER: Invalid move direction: ${direction}`],
        });
        return;
    }
    if (
      newPos.x < 0 ||
      newPos.x >= this.gameSettings.map.width ||
      newPos.y < 0 ||
      newPos.y >= this.gameSettings.map.height
    ) {
      player.logs.push({
        type: "error",
        values: [`SERVER: Unit ${unit.id} cannot move out of bounds.`],
      });
      return;
    }
    const tile = this.map[newPos.y][newPos.x];
    if (tile.type == "wall") {
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Unit ${unit.id} cannot move into a ${tile.type} at (${newPos.x},${newPos.y}).`,
        ],
      });
      return;
    }

    // Check if the new position is already occupied by another unit
    const unitAtNewPos = this.players.some((p) =>
      p.units.some(
        (u) => (u.position.x) === newPos.x && (u.position.y) === newPos.y,
      )
    );
    if (unitAtNewPos) {
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Unit ${unit.id} cannot move to an occupied position (${newPos.x},${newPos.y}).`,
        ],
      });
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
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Player ${player.id} is not allowed to attack with unit ${unit.id}`,
        ],
      });
      return;
    }
    // Check if unit is within attack range - assuming range is 1 for melee, 3 for ranged
    const distanceToTarget = Math.sqrt(
      Math.pow(unit.position.x - target.x, 2) + Math.pow(unit.position.y - target.y, 2),
    );
    const attackRange = this.gameSettings.unit[unit.type].range;
    if (distanceToTarget > attackRange) {
      player.logs.push({
        type: "error",
        values: [`SERVER: Target at (${target.x},${target.y}) is out of range for ${unit.type} unit.`],
      });
      return;
    }

    for (const enemy of this.players.filter((p) => p.id !== player.id)) {
      const targetUnit = enemy.units.find(
        (u) => u.position.x === target.x && u.position.y === target.y,
      );
      if (targetUnit) {
        const damage = unit.type === "melee" ? 20 : 15;
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
    player.logs.push({
      type: "error",
      values: [`SERVER: No enemy unit found at (${target.x},${target.y})`],
    });

    // Check if there's an enemy base at target position
    const targetTile = this.map?.[target.y]?.[target.x];
    if (!targetTile) {
      player.logs.push({
        type: "error",
        values: [`SERVER: Invalid target position (${target.x},${target.y})`],
      });
      return;
    }
    if (targetTile?.type === "base" && targetTile.owner !== player.id) {
      const damage = unit.type === "melee" ? 15 : 10;
      console.log(`Unit ${unit.id} (${unit.type}) attacks enemy base for ${damage} damage`);
      targetTile.health! -= damage;

      if (targetTile.health! <= 0) {
        console.log(`Base at (${target.x},${target.y}) has been destroyed`);
        // Convert base to ground
        this.map[target.y][target.x] = {
          type: "ground",
          position: { x: target.x, y: target.y },
        };
        // Remove base position from enemy player
        const enemyPlayer = this.players.find((p) => p.id === targetTile.owner);
        if (enemyPlayer) {
          enemyPlayer.basePosition = undefined;
          this.lossers.push(enemyPlayer.id);
        }
      }
      return;
    }
  }

  // Mines an ore tile to collect resources
  mineResource(player: Player, unit: Unit) {
    if (unit.owner !== player.id) {
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Player ${player.id} is not allowed to mine with unit ${unit.id}`,
        ],
      });
      return;
    }
    const pos = unit.position;
    const tile = this.map[pos.y][pos.x];
    if (tile.type === "ore") {
      console.log(
        `Miner unit ${unit.id} is mining at (${pos.x},${pos.y}). Resources collected!`,
      );
      // player.coins += 20;
      // (unit as Miner).inventory.ore += 1;

      this.map[pos.y][pos.x] = { ...tile, type: "ground" };
    } else {
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Unit ${unit.id} is not on an ore tile at (${pos.x},${pos.y}).`,
        ],
      });
    }
  }

  // Purchases new units if the player has enough coins
  buyUnit(player: Player, item: string, quantity: number) {
    const costPerUnit = this.gameSettings.unit[item].price;
    if (!costPerUnit) {
      player.logs.push({
        type: "error",
        values: [`SERVER: Invalid unit type: ${item}`],
      });
      return;
    }
    const totalCost = costPerUnit * quantity;
    if (player.coins < totalCost) {
      player.logs.push({
        type: "error",
        values: [
          `SERVER: Not enough coins to buy ${quantity} ${item} unit(s).`,
        ],
      });
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
        position: player.basePosition ? { ...player.basePosition } : { x: 0, y: 0 },
        health: this.gameSettings.unit[item].health,
        owner: player.id,
        actionTaken: false,
      };
      player.units.push(newUnit);
    }
  }

  // Updates each player's map view with fog of war
  updatePlayerMapView() {
    if (!this.gameSettings.fogOfWar) {
      this.players.forEach((player) => {
        player.mapView = this.map.map((row) => row.map((tile) => ({ ...tile })));
      });
      return;
    }
    // Reset each player's map view first
    this.players.forEach((player) => {
      // Initialize empty map with fog of war (all unknown)
      player.mapView = Array(this.gameSettings.map.height).fill(null).map((_, y) =>
        Array(this.gameSettings.map.width).fill(null).map((_, x) => ({
          type: "unknown",
          position: { x, y },
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
    mapView: Tile[][],
    centerX: number,
    centerY: number,
    radius: number,
  ) {
    for (
      let y = Math.max(0, centerY - radius);
      y <= Math.min(this.gameSettings.map.height - 1, centerY + radius);
      y++
    ) {
      for (
        let x = Math.max(0, centerX - radius);
        x <= Math.min(this.gameSettings.map.width - 1, centerX + radius);
        x++
      ) {
        const distance = Math.sqrt(
          Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2),
        );
        if (distance <= radius) {
          const tile = this.map[y][x];
          mapView[y][x] = tile;
        }
      }
    }
  }
}
