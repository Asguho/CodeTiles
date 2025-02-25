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
}

class Game {
  players: Player[];
  turn: number;
  // You could add additional properties for the grid map, resources, etc.

  constructor(players: Player[]) {
    this.players = players;
    this.turn = 0;
  }

  // This method starts the game loop
  async start() {
    while (!this.isGameOver()) {
      await this.processTurn();
      // Optionally add a delay between turns if necessary
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

      // Locate the unit and update its state accordingly
      // For example:
      // if (action.action === 'move') { this.moveUnit(player, action.unitId, action.direction) }
      // if (action.action === 'attack') { this.attackWithUnit(player, action.unitId, action.target) }
    });

    // Process shop actions to purchase new units or items
    response.actions.shop.forEach((order) => {
      console.log(`Player ${player.id} - Processing shop order:`, order);
      // Implement purchasing logic
      // e.g.: if (order.type === 'buy') { this.buyUnit(player, order.item, order.quantity) }
    });
  }

  // Placeholder for additional game logic methods, e.g., moveUnit, attackWithUnit, buyUnit...
}

// Sample usage:
const players: Player[] = [
  {
    id: "player1",
    serverUrl: "http://localhost:3001", // Player's server endpoint
    mapView: {}, // The part of the map visible to the player (to be defined)
    units: [
      { id: "unit-1", type: "melee", position: { x: 0, y: 0 }, health: 100 },
      { id: "unit-2", type: "ranged", position: { x: 1, y: 0 }, health: 80 },
    ],
    coins: 100,
  },
  // ...Initialize additional players as needed...
];

const game = new Game(players);
game.start();
