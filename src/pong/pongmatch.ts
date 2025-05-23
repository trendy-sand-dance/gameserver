import { DATABASE_URL } from "../types";
import { broadcast } from '../controllers/wsGame.controller.js';

interface PlayerIDs {
  left: number,
  right: number,
}

interface Scores {
  left: number,
  right: number,
}

export default class PongMatch {

  private matchId: number = 0;
  private playerIDs: PlayerIDs = { left: 0, right: 0 };
  private scores: Scores = { left: 0, right: 0 };
  private finished: boolean = false;
  private isFinals: boolean = false;

  constructor(leftPlayerId: number, rightPlayerId: number, finals: boolean) {

    this.playerIDs['left'] = leftPlayerId;
    this.playerIDs['right'] = rightPlayerId;
    this.isFinals = finals;

  }

  async initialize() {

    try {

      const response = await fetch(`${DATABASE_URL}/makeMatch/${this.playerIDs['left']}/${this.playerIDs['right']}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: { player1: this.playerIDs['left'], player2: this.playerIDs['right'] } })
      });
      if (!response.ok) {
        throw { code: 500, message: "Failed to upate user" };
      }

      const responseData = await response.json() as { message: string, matchId: number };
      console.log("here's the message: ", responseData.message, ", here's the matchId: ", responseData.matchId);
      this.matchId = responseData.matchId;
      console.log("this.matchID: ", this.matchId);

    }
    catch (error) {

      console.error(`Couldn't create new match!`, error);

    }

  }

  update(scoreLeft: number, scoreRight: number) {

    this.scores['left'] = scoreLeft;
    this.scores['right'] = scoreRight;

  }

  updateScore(side: 'left' | 'right'): void {

    console.log(`${side} scored, updating score from ${this.scores[side]}`);
    this.scores[side]++;
    console.log(`...to ${this.scores[side]}. Corresponding ID: ${this.playerIDs[side]}`);

  }

  updateScoreById(id: number): void {

    if (this.playerIDs['left'] === id) {
      this.scores['left']++;
    } else if (this.playerIDs['right'] === id) {
      this.scores['right']++;
    }

  }

  getPlayer(side: 'left' | 'right'): number {

    return this.playerIDs[side];

  }

  getPlayers(): number[] {

    return [this.playerIDs['left'], this.playerIDs['right']];

  }

  getWinner(): number {

    return this.scores['left'] > this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];

  }

  getLoser(): number {

    return this.scores['left'] < this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];

  }

  isFinished(): boolean {

    return this.finished;

  }

  setFinished(state: boolean): void {

    this.finished = state;

  }

  async saveMatch(isTournament: boolean) {

    try {

      const winnerId = this.getWinner();
      const loserId = this.getLoser();
      const matchId = this.matchId;
      this.setFinished(true);

      console.log("Saving match... winnerId, loserId: ", winnerId, loserId);
      const response = await fetch(`${DATABASE_URL}/saveMatch/${matchId}/${winnerId}/${loserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: matchId, players: { winnerId: winnerId, loserId: loserId }, tournament: isTournament })
      });
      if (!response.ok) {
        throw { code: 500, message: "Failed to update user" };
      }

      if (isTournament)
        broadcast({ type: "finish_game_tournament", winnerId: winnerId, finals: this.isFinals }, null);
      else
        broadcast({ type: "finish_game", winnerId: winnerId }, null);
      this.finished = true;

    }
    catch (error) {

      console.error(`Couldn't save match!`, error);

    }

  }

}
