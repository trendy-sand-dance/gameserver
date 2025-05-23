import { WebSocket } from '@fastify/websocket';
import Paddle from './paddle.js';
import Ball from './ball.js';
import PongMatch from './pongmatch.js';
import Tournament from './tournament.js';
import { broadcast } from '../controllers/wsGame.controller.js';
import { TournamentState } from '../types.js';


function isWithinRange(value: number, target: number, range: number) {
  return Math.abs(value - target) <= range;
}

export default class PongGame {
  // Pong Game data
  // Ball
  private ball: Ball = new Ball({ x: 2, y: 1 }, 0.05);

  // Paddle
  private paddleHeight: number = 0.5;

  // Players & Clients
  private paddles: PaddleMap = { left: new Paddle(1, 0.5, 0.05, 2), right: new Paddle(1, 0.5, 0.05, 2) };
  private players: PlayerMap = { left: null, right: null };
  private clients: ClientMap = { left: null, right: null };

  // Table data
  private table: number;
  private tableWidth: number;
  private tableHeight: number;

  // Match data
  private inProgress: boolean = false;
  private startTimer: number = 3;
  private scoreLimit: number = 1;

  private matches: PongMatch[] = [];
  private isTournament: boolean = false;

  constructor(table: number, width: number, height: number, isTournament: boolean) {
    this.table = table;
    this.tableWidth = width;
    this.tableHeight = height;
    this.isTournament = isTournament;
  }

  assignPlayer(player: PongPlayer, client: WebSocket): PongPlayer | null {

    if (!player || !client)
      return null;

    player.paddleY = this.tableHeight / 2;
    player.ready = true;
    player.score = 0;

    this.players[player.side] = player;
    this.clients[player.side] = client;

    console.log("assign player: this.players[player.side]: ", this.players[player.side]);

    return this.players[player.side];
  }

  async startGame() {

    if (this.clients['left'] && this.clients['right'] && this.players['left'] && this.players['right']) {
      this.clients['left'].send(JSON.stringify({ type: "start_pong_game" }));
      this.clients['right'].send(JSON.stringify({ type: "start_pong_game" }));
      this.ball.respawn({ x: 2, y: 1 }, 0.05, null);
      this.inProgress = true;

      if (this.matches.length === 0) {
        const match = new PongMatch(this.players['left'].id, this.players['right'].id);
        await match.initialize();
        this.matches.push(match);
      }
      this.startGameloop();

    }

  }

  async startTournamentGame(tournament: Tournament) {

    if (this.clients['left'] && this.clients['right'] && this.players['left'] && this.players['right']) {
      this.clients['left'].send(JSON.stringify({ type: "start_pong_game_tournament" }));
      this.clients['right'].send(JSON.stringify({ type: "start_pong_game_tournament" }));
      this.ball.respawn({ x: 2, y: 1 }, 0.05, null);
      this.inProgress = true;

      const match = tournament.getCurrentMatch();

      if (this.matches.length === 0 && match) {

        await match.initialize();
        this.matches.push(match);
      }
      tournament.transitionTo(TournamentState.Playing);
      this.startTournamentGameloop(tournament);

    }


  }

  async stopGame() {

    this.inProgress = false;

    this.players['left'] = null;
    this.players['right'] = null;
    this.clients['left'] = null;
    this.clients['right'] = null;

    const match = this.matches.pop();
    if (match) {
      await match.saveMatch(this.isTournament);
    }

  }

  async finishGame() {

    this.inProgress = false;

    this.players['left'] = null;
    this.players['right'] = null;
    this.clients['left'] = null;
    this.clients['right'] = null;

    const match = this.matches.pop();
    if (match) {
      await match.saveMatch(this.isTournament);
    }

  }


  setInProgress(state: boolean) {

    this.inProgress = state;

  }

  isInProgress(): boolean {

    return this.inProgress;

  }

  countdownTimer() {

    let sec: number = this.startTimer;

    let timer = setInterval(() => {

      sec--;
      if (this.clients['left'] && this.clients['right']) {
        this.clients['left'].send(JSON.stringify({ type: "countdown_pong", timer: sec }));
        this.clients['right'].send(JSON.stringify({ type: "countdown_pong", timer: sec }));
      }

      if (sec < 0) {
        clearInterval(timer);
        this.startGame();
      }

    }, 1000);

  }

  countdownTournamentTimer(tournament: Tournament) {

    let sec: number = this.startTimer;

    let timer = setInterval(() => {

      sec--;
      if (this.clients['left'] && this.clients['right']) {
        this.clients['left'].send(JSON.stringify({ type: "countdown_pong_tournament", timer: sec }));
        this.clients['right'].send(JSON.stringify({ type: "countdown_pong_tournament", timer: sec }));
      }

      if (sec < 0) {
        clearInterval(timer);
        this.startTournamentGame(tournament);
      }

    }, 1000);

  }

  startGameloop() {

    const ticker = setInterval(() => {

      if (this.isInProgress()) {
        this.handleBall();
        let pos: Vector2 | undefined = this.getBallState();

        if (pos) {
          broadcast({ type: "ball_move", ball: pos }, null);
        }

      }
      else {
        clearInterval(ticker);
      }
    }, 33); // 33 milliseconds = ~ 30 frames per sec

  }

  startTournamentGameloop(tournament: Tournament) {

    const ticker = setInterval(() => {

      if (this.isInProgress()) {
        this.handleBall();
        let pos: Vector2 | undefined = this.getBallState();

        if (pos) {
          broadcast({ type: "ball_move_tournament", ball: pos }, null);
        }

      }
      else {
        tournament.transitionTo(TournamentState.Concluding);
        clearInterval(ticker);
      }
    }, 33); // 33 milliseconds = ~ 30 frames per sec

  }

  playersAreReady(): boolean {

    if (this.players['left']?.ready && this.players['right']?.ready)
      return true;
    return false;

  }

  getPlayer(side: 'left' | 'right'): PongPlayer | null {

    return this.players[side];

  }

  getClient(side: 'left' | 'right') {

    return this.clients[side];

  }

  removePlayer(player: PongPlayer) {

    this.players[player.side] = null;
    this.clients[player.side] = null;

  }

  handlePaddle(side: 'left' | 'right', input: 'up' | 'down') {

    if (this.players[side]) {

      this.paddles[side].update(input);
      this.players[side].paddleY = this.paddles[side].getPaddleY();

      console.log("handle paddleY update: ", this.players[side].paddleY);
    }

  }

  handleBall() {

    let ballPos = this.ball.getPosition();
    let side: string = ballPos.x < 2 ?  'left' : 'right';
    let scorer: string = ballPos.x < 2 ?  'right' : 'left';

    if (!this.players[side] || !this.clients[side])
      return;

    if (ballPos.x <= 0 || ballPos.x >= this.tableWidth) { // bounceX & scoring

      if (this.paddles[side].collides(this.ball.getPosition().y)) {
        this.ball.bounceX();
      }
      else {
        this.players[scorer].score++;
        console.log("Player scored!:", this.players[scorer]);
        if (this.isTournament) {
          this.clients['left']?.send(JSON.stringify({ type: "score_update_tournament", side: scorer, score: this.players[scorer].score }));
          this.clients['right']?.send(JSON.stringify({ type: "score_update_tournament", side: scorer, score: this.players[scorer].score }));
        }
        else {
          this.clients['left']?.send(JSON.stringify({ type: "score_update", side: scorer, score: this.players[scorer].score }));
          this.clients['right']?.send(JSON.stringify({ type: "score_update", side: scorer, score: this.players[scorer].score }));
        }
        if (this.matches[0])
          this.matches[0].update(this.players['left']!.score, this.players['right']!.score);
        if (this.players[scorer].score >= this.scoreLimit) {
          this.finishGame();
        }
        else {
          this.setInProgress(false);
          this.countdownTimer();
        }
      }
    }
    if (ballPos.y <= 0 || ballPos.y >= this.tableHeight) { // bounceY
      this.ball.bounceY();
    }
    this.ball.update();

  }

  getBallState(): Vector2 | undefined {
    return this.ball.getPosition();
  }

  getPongState() {

    if (this.players['right'] && this.players['left']) {

      return {

        players: {
          left: this.players['left'],
          right: this.players['right']
        },
        ball: this.getBallState()

      };

    }

  }

  getPaddleState() {

    console.log("getPaddleState() player left and right: ", this.players['left'], this.players['right']);
    if (this.players['right'] && this.players['left']) {

      return {

        paddles: {
          left: this.players['left'].paddleY as number,
          right: this.players['right'].paddleY as number
        }

      };

    }
    else {
      console.error("getState() failed due to initialized player(s)");
    }

  }

  getTableId(): number {
    return this.table;
  }
}
