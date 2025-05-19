import PongMatch from './pongmatch.js';
// import PongGame from './ponggame.js';

export default class Tournament {

  // private pongGame : PongGame;
  private players: TournamentPlayer[] = [];
  private matches: PongMatch[] = [];
  private isFull: boolean = false;

  constructor() {

  }

  subscribe(player: TournamentPlayer) {

    if (this.players.length >= 4) {
      console.error("Can't subscribe, Tournament is full!");
      return;
    }

    if (this.players.some(p => p.id === player.id)) {
      console.error("Can't subscribe, player is already subscribed!");
      return;
    }

    this.players.push(player);
    this.isFull = this.players.length >= 4;
  }

  unsubscribe(player: TournamentPlayer) {

    const index = this.players.findIndex(p => p.id === player.id);
    if (index === -1) {
      console.error("In unsubscribe(): Can't find player in array!");
    }

    this.players.splice(index, 1);
    this.isFull = this.players.length >= 4;

  }

  schedulePongMatches(): PongMatch[] {

    let nums: number[] = [0, 1, 2, 3];
    let randomSequence: number[] = [];
    let i: number = nums.length;
    let j: number = 0;

    while (i--) {
      j = Math.floor(Math.random() * (i + 1));
      randomSequence.push(nums[j]);
      nums.splice(j, 1);
    }

    console.log("randomSequence: ", randomSequence);

    for (let i = 0; i < randomSequence.length; i += 2) {

      let r1 = randomSequence[i];
      let r2 = randomSequence[i + 1];

      this.matches.push(new PongMatch(this.players[r1].id, this.players[r2].id));

    }

    console.log("scheduled this.matches: ", this.matches);
    return this.matches;

  }

  getPlayers(): TournamentPlayer[] {

    return this.players;

  }

  getNumberOfPlayers(): number {

    return this.players.length;

  }

  isTournamentFull(): boolean {

    return this.isFull;

  }

}
