import PongMatch from './pongmatch.js';
import { broadcast } from '../controllers/wsGame.controller.js';
import { TournamentState } from '../types.js';

export default class Tournament {

  private players: TournamentPlayer[] = [];
  private matches: PongMatch[] = [];
  private state: TournamentState = TournamentState.Enrolling;
  private round: number = 0;
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

  countdownAnnouncement() {

    let sec: number = 60;

    const match = this.getCurrentMatch();
    if (!match) {
      return;
    }
    const matchPlayers = match?.getPlayers();
    if (!matchPlayers) {
      return;
    }

    const left = match.getPlayer('left');
    const right = match.getPlayer('right');

    const tournamentPlayers = this.players.filter(p => p.id === left || p.id === right);
    console.log("tournamentPlayers as broadcasted: ", tournamentPlayers[0], tournamentPlayers[1]);

    let timer = setInterval(() => {

      sec--;
      broadcast({ type: "announce_match", match: match, players: { left: tournamentPlayers[0], right: tournamentPlayers[1] }, seconds: sec }, null);

      if (sec < 0) {
        clearInterval(timer);
        this.transitionTo(TournamentState.Concluding);
      } else if (this.state === TournamentState.Playing) {
        clearInterval(timer);
      }

    }, 1000);

  }

  announcePongMatch() {

    if (this.matches[this.round].getPlayers()) {
      const players = this.matches[this.round].getPlayers();
      console.log(`${players[0]} will play against ${players[1]}! Please lock in now!`);
      this.countdownAnnouncement();
    }
    else {
      console.error("Couldn't announcePongMatch() due to current match being unavailable");
    }
  }

  transitionTo(newState: TournamentState) {

    console.log(`Tournament transitioning from ${this.state} to ${newState}`);
    this.state = newState;


    switch (newState) {
      case TournamentState.Enrolling:
        console.log("Currently enrolling... waiting for players to fill up the subscribtion pool");
        break;

      case TournamentState.Scheduling:
        if (this.round === 0 && this.schedulePongMatches()) {
          this.transitionTo(TournamentState.Announcing);
        }
        else if (this.round === 2 && this.scheduleFinals()) {
          this.transitionTo(TournamentState.Announcing);
        }
        else {
          this.transitionTo(TournamentState.Concluding);
        }
        break;

      case TournamentState.Announcing:
        this.announcePongMatch();
        break;

      case TournamentState.Playing:
        break;

      case TournamentState.Concluding:
        if (this.matches[this.round] && !this.matches[this.round].isFinished()) {// Something happened or no player was on time in the announcemnt phase
          console.error("Match couldn't start!");
        }
        this.round++;
        if (this.round === 1)
          this.transitionTo(TournamentState.Announcing);
        else if (this.round === 2)
          this.transitionTo(TournamentState.Scheduling);
        else if (this.round === 3) { // It's ogre
          this.transitionTo(TournamentState.Enrolling);
          this.matches.splice(0, this.matches.length);
          this.players.splice(0, this.players.length);
          this.round = 0;
          this.isFull = false;
        }
        break;
    }


  }

  scheduleFinals(): boolean {

    const matches = this.matches.filter(match => match.isFinished());
    if (matches.length === 2) {
      const w1Id = matches[0].getWinner();
      const w2Id = matches[1].getWinner();
      this.players = this.players.filter(p => p.id !== w1Id && p.id !== w2Id);
      if (this.players[0] && this.players[1])
        this.matches.push(new PongMatch(this.players[0].id, this.players[1].id));
    }

    return this.matches.length === 3;

  }

  schedulePongMatches(): boolean {

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
    return this.matches.length === 2;

  }

  getPlayers(): TournamentPlayer[] {

    return this.players;

  }

  getNumberOfPlayers(): number {

    return this.players.length;

  }

  getState(): TournamentState {

    return this.state;

  }

  getCurrentMatch(): PongMatch | null {

    if (this.matches.length === 0) {
      console.error("In Tournament (getCurrentMatch()): No matches available!");
      return null;
    }
    return this.matches[this.round];

  }

  isTournamentFull(): boolean {

    return this.isFull;

  }

}
