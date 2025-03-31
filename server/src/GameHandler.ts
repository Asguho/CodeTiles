import { db } from "./db/index.ts";
import { Game } from "./Game.ts";
import { user as userTable } from "./db/schema.ts";
import { eq } from "drizzle-orm/expressions";
import { GameSettings, TurnData } from "./types.ts";

const gameSettings: GameSettings = {
  map: {
    width: 10,
    height: 10,
  },
  maxTurns: 25,
  fogOfWar: false,
  unit: {
    melee: { health: 100, attack: 20, range: 1, price: 50, damage: 20 },
    ranged: { health: 80, attack: 15, range: 3, price: 60 },
    miner: { health: 50, attack: 5, range: 1, price: 40 },
    // healer: { health: 60, attack: 10, range: 2, price: 70 },
    // scout: { health: 40, attack: 5, range: 4, price: 30 },
    // tank: { health: 150, attack: 25, range: 1, price: 80 },
    // sniper: { health: 70, attack: 20, range: 5, price: 90 },
    // bomber: { health: 60, attack: 30, range: 3, price: 100 },
    // engineer: { health: 50, attack: 10, range: 1, price: 40 },
    // spy: { health: 30, attack: 5, range: 2, price: 20 },
    // artillery: { health: 80, attack: 40, range: 6, price: 120 },
    // medic: { health: 50, attack: 0, range: 2, price: 70 },
  },
};

export class GameHandler {
  private games: Map<string, Game> = new Map();
  constructor() {
    this.games = new Map();
  }
  startGame(players: { id: string; url: string }[]) {
    const gameId = crypto.randomUUID();
    const cleanUp = async (outCome: string[] | null) => {
      if (outCome) {
        console.log("Game finished with outcome:", outCome);
        // Iterate through the players in the outcome and update Elo rankings
        for (let i = 0; i < outCome.length; i++) {
          const playerId = outCome[i];
          if (i > 0) {
            await updateEloRanking(playerId, outCome[i - 1], false); // Current player lost to the one before
          }
        }
      }

      async function updateEloRanking(player1Id: string, player2Id: string, player1Won: boolean) {
        const [player1] = await db.select().from(userTable).where(eq(userTable.id, player1Id));
        const [player2] = await db.select().from(userTable).where(eq(userTable.id, player2Id));

        if (!player1 || !player2) {
          console.error("Player not found in database");
          return;
        }

        // Elo constants
        const K = 32; // Standard K-factor

        // Get current ratings
        const ratingPlayer1 = player1.elo || 1000;
        const ratingPlayer2 = player2.elo || 1000;

        // Calculate expected scores
        const expectedScorePlayer1 = 1 / (1 + Math.pow(10, (ratingPlayer2 - ratingPlayer1) / 400));
        const expectedScorePlayer2 = 1 / (1 + Math.pow(10, (ratingPlayer1 - ratingPlayer2) / 400));

        // Calculate new ratings
        const scorePlayer1 = player1Won ? 1 : 0;
        const scorePlayer2 = player1Won ? 0 : 1;

        const newRatingPlayer1 = Math.round(ratingPlayer1 + K * (scorePlayer1 - expectedScorePlayer1));
        const newRatingPlayer2 = Math.round(ratingPlayer2 + K * (scorePlayer2 - expectedScorePlayer2));

        // Update database with new ratings
        await db.update(userTable)
          .set({ elo: newRatingPlayer1 })
          .where(eq(userTable.id, player1Id));

        await db.update(userTable)
          .set({ elo: newRatingPlayer2 })
          .where(eq(userTable.id, player2Id));

        console.log(
          `Updated Elo: ${player1.username || player1Id} (${ratingPlayer1} → ${newRatingPlayer1}) ${
            player1Won ? "won against" : "lost to"
          } ${player2.username || player2Id} (${ratingPlayer2} → ${newRatingPlayer2})`,
        );
      }

      this.games.delete(gameId);
    };
    const game = new Game(players, gameSettings, cleanUp);
    game.start();
    this.games.set(gameId, game);
  }

  static runTutorial(player: { id: string; url: string }) {
    // Track tutorial goals
    const goals = {
      buyMiner: false,
      moveUnit: false,
      moveToOre: false,
      mineOre: false,
      returnResources: false,
      buyAttackUnit: false,
      attackEnemyUnit: false,
      attackEnemyBase: false,
      winGame: false,
    };

    // Create a function to send goal updates to the player
    const sendGoalUpdate = (game: Game) => {
      const player = game.players[0];
      const message = {
        type: "tutorial_progress",
        goals,
        completedGoals: Object.values(goals).filter((goal) => goal).length,
        totalGoals: Object.keys(goals).length,
      };

      // Send message through the player's connection
      player.sendMessage(message);
    };

    // Tutorial logic checker that runs each turn
    const tutorialChecker = (game: Game) => {
      const player = game.players[0];

      // Check if player has a miner
      if (!goals.buyMiner && player.units.some((unit) => unit.type === "miner")) {
        goals.buyMiner = true;
        sendGoalUpdate(game);
      }

      // Check if any unit has moved from its starting position
      if (!goals.moveUnit && player.units.some((unit) => unit.hasMoved)) {
        goals.moveUnit = true;
        sendGoalUpdate(game);
      }

      // Check if a unit is on an ore tile
      if (!goals.moveToOre && player.units.some((unit) => game.map.getTile(unit.position.x, unit.position.y).type === "ore")) {
        goals.moveToOre = true;
        sendGoalUpdate(game);
      }

      // Check if resources have been mined
      if (!goals.mineOre && player.units.some((unit) => unit.type === "miner" && unit.resources > 0)) {
        goals.mineOre = true;
        sendGoalUpdate(game);
      }

      // Check if resources have been returned to base
      if (!goals.returnResources && player.resources > 0) {
        goals.returnResources = true;
        sendGoalUpdate(game);
      }

      // Check if player has bought an attack unit
      if (!goals.buyAttackUnit && player.units.some((unit) => unit.type === "melee" || unit.type === "ranged")) {
        goals.buyAttackUnit = true;
        sendGoalUpdate(game);
      }

      // Check if player has attacked an enemy unit
      if (!goals.attackEnemyUnit && game.turnData.some((turn: TurnData) => turn.type === "attack" && turn.attackerId === player.id)) {
        goals.attackEnemyUnit = true;
        sendGoalUpdate(game);
      }

      // Check if player has attacked enemy base
      if (
        !goals.attackEnemyBase && game.turnData.some((turn: TurnData) =>
          turn.type === "attack" && turn.targetId &&
          game.getUnitById(turn.targetId)?.isBase
        )
      ) {
        goals.attackEnemyBase = true;
        sendGoalUpdate(game);
      }

      // Check if player has won the game
      if (!goals.winGame && game.isGameOver() && game.getWinner()?.id === player.id) {
        goals.winGame = true;
        sendGoalUpdate(game);
      }

      // Send complete summary at the end of each turn
      sendGoalUpdate(game);
    };

    // Initialize tutorial game with AI opponent
    const game = new Game([player], gameSettings, () => {
      // Send final results when game ends
      const player = game.players[0];
      const completedGoals = Object.values(goals).filter((goal) => goal).length;
      const message = {
        type: "tutorial_complete",
        goals,
        completedGoals,
        totalGoals: Object.keys(goals).length,
        success: completedGoals === Object.keys(goals).length,
      };
      player.sendMessage(message);
    }, tutorialChecker);

    game.start();
    return game;
  }
}

/* Tutorial goals:
- buy one miner unit
- move a unit
- move a unit to an ore tile
- mine ore with a unit
- bring resources back
- buy an attack unit
- attack an enemy unit
- attack an enemy base
- win the game
*/
