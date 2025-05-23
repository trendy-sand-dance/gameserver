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

  constructor(leftPlayerId: number, rightPlayerId: number) {

    this.playerIDs['left'] = leftPlayerId;
    this.playerIDs['right'] = rightPlayerId;

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

  getPlayer(side: 'left' | 'right'): number {

    return this.playerIDs[side];

  }

  getPlayers(): number[] {

    return [this.playerIDs['left'], this.playerIDs['right']];

  }

  getWinner(): number {

    console.log("getWinner(), leftId", this.playerIDs['left'], ", score: ", this.scores['left']);
    console.log("getWinner(), rightId", this.playerIDs['right'], ", score: ", this.scores['right']);
    console.log("returning: ", this.scores['left'] > this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right']);

    return this.scores['left'] > this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];

  }

  getLoser(): number {

    console.log("getLoser(), leftId", this.playerIDs['left'], ", score: ", this.scores['left']);
    console.log("getLoser(), rightId", this.playerIDs['right'], ", score: ", this.scores['right']);
    console.log("returning: ", this.scores['left'] < this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right']);

    return this.scores['left'] < this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];

  }

  isFinished(): boolean {

    return this.finished;

  }

  async saveMatch(isTournament: boolean) {

    try {

      const winnerId = this.getWinner();
      const loserId = this.getLoser();
      const matchId = this.matchId;

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
        broadcast({ type: "finish_game_tournament", winnerId: winnerId }, null);
      else
        broadcast({ type: "finish_game", winnerId: winnerId }, null);
      this.finished = true;

    }
    catch (error) {

      console.error(`Couldn't save match!`, error);

    }

  }

}
