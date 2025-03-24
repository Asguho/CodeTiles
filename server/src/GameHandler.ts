import { db } from "./db/index.ts";
import { Game } from "./Game.ts";
import { user as userTable } from "./db/schema.ts";
import { eq } from "drizzle-orm/expressions";
export class GameHandler {
  private games: Map<string, Game> = new Map();
  constructor() {
    this.games = new Map();
  }
  startGame(players: { id: string; url: string }[]) {
    const gameId = crypto.randomUUID();
    const cleanUp = async (outCome: string[] | null) => {
      if(outCome) {
        console.log("Game finished with outcome:", outCome);
        // Iterate through the players in the outcome and update Elo rankings
        for (let i = 0; i < outCome.length; i++) {
          const playerId = outCome[i];
          if (i > 0) {
            await updateEloRanking(playerId, outCome[i-1], false); // Current player lost to the one before
          }
        }
      }

      async function updateEloRanking(player1Id: string, player2Id: string, player1Won: boolean) {
        const [player1] = await db.select().from(userTable).where(eq(userTable.id, player1Id))
        const [player2] = await db.select().from(userTable).where(eq(userTable.id, player2Id));
        
        if (!player1 || !player2) {
          console.error('Player not found in database');
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
        
        console.log(`Updated Elo: ${player1.username || player1Id} (${ratingPlayer1} → ${newRatingPlayer1}) ${player1Won ? 'won against' : 'lost to'} ${player2.username || player2Id} (${ratingPlayer2} → ${newRatingPlayer2})`);
      }


      this.games.delete(gameId);
    };
    const game = new Game(players, cleanUp);
    game.start();
    this.games.set(gameId, game);
  }
}
