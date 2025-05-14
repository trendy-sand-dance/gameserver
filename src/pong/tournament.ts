import PongMatch from './pongmatch.js';
// import PongGame from './ponggame.js';

export default class Tournament {

  // private pongGame : PongGame;
  private players : PongPlayer[] = [];
  private matches : PongMatch[] = [];
  private isFull : boolean = false;

  constructor() {

  }

  subscribe(player : PongPlayer) {

    if (this.players.length >= 4) {
      console.error("Can't subscribe, Tournament is full!");
      return;
    } 

    this.players.push(player);

    if (this.players.length >= 4) {
      this.isFull = true;
    }
    else {
      this.isFull = false;
    }

  }

  unsubscribe(player : PongPlayer) {

    const index = this.players.indexOf(player);
    if (index === -1) {
      console.error("In unsubscribe(): Can't find player in array!");
    }
    this.players.splice(index, 1);
    if (this.players.length < 4)
      this.isFull = false;

  }

  schedulePongMatches() {

    let nums : number[] = [0,1,2,3];
    let randomSequence : number[] = [];
    let i : number = nums.length;
    let j : number = 0;

    while (i--) {
      j = Math.floor(Math.random() * (i+1));
      randomSequence.push(nums[j]);
      nums.splice(j,1);
    }

    console.log("randomSequence: ", randomSequence);

    for (let i = 0; i < randomSequence.length; i+=2) {

      let r1 = randomSequence[i];
      let r2 = randomSequence[i + 1];

      this.matches.push(new PongMatch(this.players[r1].id, this.players[r2].id));

    }

    console.log("scheduled this.matches: ", this.matches);

  }

  getPlayers() : PongPlayer[] {

    return this.players;

  }

  getNumberOfPlayers() : number {

    return this.players.length;

  }

  isTournamentFull() : boolean {

    return this.isFull;

  }

}
