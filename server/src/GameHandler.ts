import { Game } from "./Game.ts";
export class GameHandler {
  private games: Map<string, Game> = new Map();
  constructor() {
    this.games = new Map();
  }
  startGame(players: { id: string; url: string }[]) {
    const game = new Game(players);
    game.start();
    this.games.set(crypto.randomUUID(), game);
  }
}
