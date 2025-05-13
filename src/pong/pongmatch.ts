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

  private matchId : number = 0;
  private playerIDs : PlayerIDs = {left: 0, right: 0};
  private scores : Scores = {left: 0, right: 0};

  constructor(leftPlayerId : number, rightPlayerId : number) {

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

      const responseData = await response.json() as {message : string, matchId : number};
      console.log("here's the message: ", responseData.message, ", here's the matchId: ", responseData.matchId);
      this.matchId = responseData.matchId;
      console.log("this.matchID: ", this.matchId);

    } 
    catch (error) {

      console.error(`Couldn't create new match!`, error);

    }

  }

  update(scoreLeft : number, scoreRight : number) {

    this.scores['left'] = scoreLeft;
    this.scores['right'] = scoreRight;

  }

  async saveMatch() {

    try {

      const winnerId = this.scores['left'] > this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];
      const loserId = this.scores['left'] < this.scores['right'] ? this.playerIDs['left'] : this.playerIDs['right'];
      const matchId = this.matchId;

      console.log("this.matchID before sending to db", matchId);
      console.log("fetch url: ", `/saveMatch/${matchId}/${winnerId}/${loserId}`);
      const response = await fetch(`${DATABASE_URL}/saveMatch/${matchId}/${winnerId}/${loserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: matchId, players: { winnerId: winnerId, loserId: loserId } })
      });
      if (!response.ok) {
        throw { code: 500, message: "Failed to update user" };
      }

      broadcast({ type: "finish_game", winnerId: winnerId}, null);

    }
    catch (error) {

      console.error(`Couldn't save match!`, error);

    }

  }

}
