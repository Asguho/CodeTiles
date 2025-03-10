declare type tileType = "unknown" | "ground" | "wall" | "ore" | "base";
declare type unitType = "melee" | "ranged" | "miner";
declare type direction = "north" | "south" | "east" | "west";

/**
 * Represents a unit in the CodeTiles game.
 */
declare class unit {
	/**
	 * Unique identifier for the unit.
	 */
	id: string;

	/**
	 * Current health points of the unit.
	 */
	health: number;

	/**
	 * Identifier of the player who owns this unit.
	 */
	owner: string;

	/**
	 * The type of this unit.
	 */
	type: unitType;

	/**
	 * The current position of the unit on the game board.
	 */
	position: {
		/**
		 * The x-coordinate (horizontal position).
		 */
		x: number;

		/**
		 * The y-coordinate (vertical position).
		 */
		y: number;
	};

	/**
	 * Reference to the game instance this unit belongs to.
	 * Protected property that is optional.
	 */
	protected game?: CodeTiles;

	/**
	 * Creates a new unit instance.
	 *
	 * @param id - Unique identifier for the unit
	 * @param health - Initial health points of the unit
	 * @param owner - Identifier of the player who owns this unit
	 * @param type - The type of this unit
	 * @param position - The initial position of the unit on the game board
	 * @param position.x - The initial x-coordinate (horizontal position)
	 * @param position.y - The initial y-coordinate (vertical position)
	 * @param game - Optional reference to the game instance this unit belongs to
	 */
	constructor(
		id: string,
		health: number,
		owner: string,
		type: unitType,
		position: {
			x: number;
			y: number;
		},
		game?: CodeTiles
	);

	/**
	 * Moves the unit in the specified direction.
	 *
	 * @param direction - The direction in which to move the unit
	 */
	move(direction: direction): void;
}

/**
 * Represents a game tile.
 *
 * @class
 */
declare class tile {
	/**
	 * The type of the tile.
	 *
	 * @type {tileType}
	 */
	type: tileType;

	/**
	 * The position of the tile in the game grid.
	 *
	 * @type {{ x: number, y: number }}
	 */
	position: {
		/**
		 * The x-coordinate of the tile.
		 *
		 * @type {number}
		 */
		x: number;

		/**
		 * The y-coordinate of the tile.
		 *
		 * @type {number}
		 */
		y: number;
	};

	/**
	 * Creates a new tile instance.
	 *
	 * @param {tileType} type - The type of the tile.
	 * @param {{ x: number, y: number }} position - The position of the tile in the game grid.
	 * @param {number} position.x - The x-coordinate of the tile.
	 * @param {number} position.y - The y-coordinate of the tile.
	 */
	constructor(
		type: tileType,
		position: {
			x: number;
			y: number;
		}
	);
}

/**
 * Class representing a base tile, extends the base tile class.
 * @class
 * @extends {tile}
 */
declare class base extends tile {
	/**
	 * The owner of the base
	 * @type {string}
	 */
	owner: string;

	/**
	 * The health of the base
	 * @type {number}
	 */
	health: number;

	/**
	 * Creates a new base
	 * @constructor
	 * @param {string} owner - The owner of the base
	 * @param {{x: number, y: number}} position - The position of the base
	 * @param {number} health - The health of the base
	 */
	constructor(
		owner: string,
		position: {
			/**
			 * The x coordinate of the position
			 * @type {number}
			 */
			x: number;

			/**
			 * The y coordinate of the position
			 * @type {number}
			 */
			y: number;
		},
		health: number
	);
}

/**
 * Represents a shop system where players can buy game units.
 */
declare class shop {
	/**
	 * Reference to the main game instance.
	 */
	game?: CodeTiles;

	/**
	 * Creates a new shop instance.
	 *
	 * @param {CodeTiles} [game] - Optional reference to the main game instance.
	 */
	constructor(game?: CodeTiles);

	/**
	 * Purchases a specified quantity of a unit type.
	 *
	 * @param {unitType} item - The type of unit to purchase.
	 * @param {number} quantity - The number of units to purchase.
	 * @returns {void}
	 */
	buy(item: unitType, quantity: number): void;
}

/**
 * Represents a game instance in the CodeTiles game.
 */
declare class Game {
	/**
	 * The unique identifier of the current player.
	 * @readonly
	 */
	readonly playerId: string;

	/**
	 * A two-dimensional array representing the game map.
	 * @readonly
	 */
	readonly map: tile[][];

	/**
	 * An array of units in the game.
	 * @readonly
	 */
	readonly units: unit[];

	/**
	 * The player's base in the game.
	 * @readonly
	 */
	readonly base: base;

	/**
	 * The current amount of coins the player has.
	 * @readonly
	 */
	readonly coins: number;

	/**
	 * The current turn number in the game.
	 * @readonly
	 */
	readonly turn: number;

	/**
	 * The shop available to the player.
	 * @readonly
	 */
	readonly shop: shop;

	/**
	 * Creates a new Game instance.
	 * @param {any} gameState - The current state of the game.
	 * @param {CodeTiles} codeTiles - The CodeTiles instance.
	 */
	constructor(gameState: any, codeTiles: CodeTiles);
}

/**
 * Represents the main CodeTiles game controller.
 * This class manages the game state and provides turn-based event handling.
 */
declare class CodeTiles {
	/**
	 * Private internal properties for the CodeTiles instance.
	 * @private
	 */
	#private: any;

	/**
	 * Creates a new CodeTiles game instance.
	 * @param {any} gameState - The initial state of the game.
	 */
	constructor(gameState: any);

	/**
	 * Registers a callback function to be called when a turn occurs in the game.
	 * @param {function} f - The callback function that will be invoked on each turn.
	 * @param {Game} f.game - The current game state passed to the callback function.
	 * @returns {void}
	 */
	onTurn(f: (game: Game) => void): void;
}

declare namespace CodeTiles {
	function onTurn(f: (game: Game) => void): void;
	// Add other global methods as needed
}
