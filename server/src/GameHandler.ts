import { db } from "./db/index.ts";
import { Game } from "./Game.ts";
import { user as userTable } from "./db/schema.ts";
import { eq } from "drizzle-orm/expressions";
import { GameSettings, TurnData } from "./types.ts";
import { socketHandler } from "./SocketHandler.ts";

const gameSettings: GameSettings = {
  map: {
    width: 15,
    height: 15,
  },
  maxTurns: 75,
  fogOfWar: false,
  unit: {
    melee: { health: 100, attack: 20, range: 1, price: 50, damage: 20 },
    ranged: { health: 80, attack: 15, range: 3, price: 60, damage: 15 },
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

const loadTutorialContent = async () => {
  const text = await Deno.readTextFile("src/tasks.md");
  const sections = text.split("\n# ").filter(Boolean);
  const tutorials: Record<string, string> = {};
  sections.forEach((section) => {
    const [name, ...content] = section.trim().split("\n");
    tutorials[name.replaceAll("#", "").trim()] = content.join("\n").trim();
  });
  // console.log("Loaded tutorials:", tutorials);
  return tutorials;
};

export class GameHandler {
  private static tutorials: Record<string, string> = {};

  constructor() {
    // Initialize tutorials when GameHandler is created
    loadTutorialContent().then((content) => {
      GameHandler.tutorials = content;
    });
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
        await db.update(userTable).set({ elo: newRatingPlayer1 }).where(eq(userTable.id, player1Id));

        await db.update(userTable).set({ elo: newRatingPlayer2 }).where(eq(userTable.id, player2Id));

        console.log(
          `Updated Elo: ${player1.username || player1Id} (${ratingPlayer1} → ${newRatingPlayer1}) ${
            player1Won ? "won against" : "lost to"
          } ${player2.username || player2Id} (${ratingPlayer2} → ${newRatingPlayer2})`,
        );
      }
    };
    const game = new Game([...players].sort(() => Math.random() - 0.5), gameSettings, cleanUp);
    game.start();
  }

  static runTutorial(player: { id: string; url: string }) {
    // Track tutorial goals
    type Goal = {
      name: string;
      tutorial: string;
      completed: boolean;
      id: string;
    };

    const goals: Goal[] = [
      {
        tutorial: GameHandler.tutorials["buyMiner"] || "",
        name: "buyMiner",
        completed: false,
        id: "1",
      },
      {
        tutorial: GameHandler.tutorials["moveUnit"] || "",
        name: "moveUnit",
        completed: false,
        id: "2",
      },
      {
        tutorial: GameHandler.tutorials["moveToOre"] || "",
        name: "moveToOre",
        completed: false,
        id: "3",
      },
      {
        tutorial: GameHandler.tutorials["mineOre"] || "",
        name: "mineOre",
        completed: false,
        id: "4",
      },
      {
        tutorial: GameHandler.tutorials["returnResources"] || "",
        name: "returnResources",
        completed: false,
        id: "5",
      },
      {
        tutorial: GameHandler.tutorials["buyAttackUnit"] || "",
        name: "buyAttackUnit",
        completed: false,
        id: "6",
      },
      {
        tutorial: GameHandler.tutorials["attackEnemyUnit"] || "",
        name: "attackEnemyUnit",
        completed: false,
        id: "7",
      },
      {
        tutorial: GameHandler.tutorials["attackEnemyBase"] || "",
        name: "attackEnemyBase",
        completed: false,
        id: "8",
      },
      {
        tutorial: GameHandler.tutorials["winGame"] || "",
        name: "winGame",
        completed: false,
        id: "9",
      },
    ];

    // Create a function to send goal updates to the player
    const sendGoalUpdate = (game: Game) => {
      const player = game.players[0];
      const message = {
        type: "tutorial_progress",
        goals,
        completedGoals: goals.filter((goal) => goal.completed).length,
        totalGoals: goals.length,
      };

      socketHandler.sendMessage(player.id, JSON.stringify(message));
    };

    const unitsWithResources: string[] = [];

    // Tutorial logic checker that runs each turn
    const tutorialChecker = (game: Game) => {
      const player = game.players[0];

      // Check if player has a miner
      const buyMinerGoal = goals.find((g) => g.name === "buyMiner");
      if (buyMinerGoal && !buyMinerGoal.completed && player.units.some((unit) => unit.type === "miner")) {
        buyMinerGoal.completed = true;
      }

      // Check if any unit has moved from its starting position
      const moveUnitGoal = goals.find((g) => g.name === "moveUnit");
      if (
        moveUnitGoal &&
        !moveUnitGoal.completed &&
        player.units.some(
          (unit) => unit.position.x !== player.basePosition!.x || unit.position.y !== player.basePosition!.y,
        )
      ) {
        moveUnitGoal.completed = true;
      }

      // Check if a unit is on an ore tile
      const moveToOreGoal = goals.find((g) => g.name === "moveToOre");
      if (
        moveToOreGoal &&
        !moveToOreGoal.completed &&
        player.units.some((unit) => game.map[unit.position.y][unit.position.x].type === "ore")
      ) {
        moveToOreGoal.completed = true;
      }
      // Check if a unit has mined ore
      // deno-lint-ignore no-explicit-any
      unitsWithResources.push(...player.units.filter((unit: any) => unit?.inventory?.ore > 0).map((unit) => unit.id));
      const mineOreGoal = goals.find((g) => g.name === "mineOre");
      if (mineOreGoal && !mineOreGoal.completed && unitsWithResources.length > 0) {
        mineOreGoal.completed = true;
      }

      const returnResourcesGoal = goals.find((g) => g.name === "returnResources");
      if (
        returnResourcesGoal &&
        !returnResourcesGoal.completed &&
        // deno-lint-ignore no-explicit-any
        player.units.some((unit: any) => unitsWithResources.includes(unit.id) && unit.inventory.ore == 0)
      ) {
        returnResourcesGoal.completed = true;
      }

      // Check if player has bought an attack unit
      const buyAttackUnitGoal = goals.find((g) => g.name === "buyAttackUnit");
      if (
        buyAttackUnitGoal &&
        !buyAttackUnitGoal.completed &&
        player.units.some((unit) => unit.type === "melee" || unit.type === "ranged")
      ) {
        buyAttackUnitGoal.completed = true;
      }

      // Check if player has attacked an enemy unit
      const attackEnemyUnitGoal = goals.find((g) => g.name === "attackEnemyUnit");
      if (
        attackEnemyUnitGoal &&
        !attackEnemyUnitGoal.completed &&
        game.players[1].units.some((unit) => unit.health < game.gameSettings.unit[unit.type].health)
      ) {
        attackEnemyUnitGoal.completed = true;
      }

      // Check if player has attacked an enemy base
      const attackEnemyBaseGoal = goals.find((g) => g.name === "attackEnemyBase");
      const enemyBase = game.players[1].basePosition;
      if (
        attackEnemyBaseGoal &&
        !attackEnemyBaseGoal.completed &&
        enemyBase &&
        (game.map[enemyBase.y][enemyBase.x] as any).health < 100
      ) {
        attackEnemyBaseGoal.completed = true;
      }

      // Check if player has won the game

      // Send complete summary at the end of each turn
      sendGoalUpdate(game);
    };

    // Initialize tutorial game with AI opponent
    const tutGameSettings: GameSettings = {
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
      },
    };
    const game = new Game(
      [player, { id: "AI", url: "https://important-dolphin-28-y3krkksasm7e.deno.dev/" }],
      tutGameSettings,
      () => {
        // Send final results when game ends
        const winGameGoal = goals.find((g) => g.name === "winGame");
        if (winGameGoal && !winGameGoal.completed) {
          winGameGoal.completed = true;
        }

        const player = game.players[0];
        const completedGoals = goals.filter((goal) => goal.completed).length;
        const message = {
          type: "tutorial_complete",
          goals,
          completedGoals,
          totalGoals: goals.length,
          success: completedGoals === goals.length,
        };
        socketHandler.sendMessage(player.id, JSON.stringify(message));
      },
      tutorialChecker,
    );

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
