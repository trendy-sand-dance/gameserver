import { WebSocket } from '@fastify/websocket';
import Paddle from './paddle.js';
import Ball from './ball.js';
import { broadcast } from '../controllers/wsGame.controller.js';

function isWithinRange(value: number, target: number, range: number) {
  return Math.abs(value - target) <= range;
}

export default class PongGame {
  // Pong Game data
    // Ball
  private ball : Ball = new Ball({x: 2, y: 1}, 0.05);

    // Paddle
  private paddleHeight: number = 0.5;

    // Players & Clients
  private paddles : PaddleMap = {left: new Paddle(1, 0.5, 0.05, 2), right: new Paddle(1, 0.5, 0.05, 2)};
  private players : PlayerMap = {left: null, right: null};
  private clients : ClientMap = {left: null, right: null};

  // Table data
  private table: number;
  private tableWidth: number;
  private tableHeight: number;

  private inProgress: boolean = false;
  private startTimer: number = 3;

  constructor(table: number, width : number, height : number) {
    this.table = table;
    this.tableWidth = width;
    this.tableHeight = height;
  }

  assignPlayer(player: PongPlayer, client: WebSocket): PongPlayer | null {

    if (!player || !client)
      return null;

    player.paddleY = this.tableHeight / 2;
    player.ready = true;
    player.score = 0;

    this.players[player.side] = player;
    this.clients[player.side] = client;

    return this.players[player.side];
  }

  startGame() {

    if (this.clients['left'] && this.clients['right']) {
      this.clients['left'].send(JSON.stringify({ type: "start_pong_game" }));
      this.clients['right'].send(JSON.stringify({ type: "start_pong_game" }));
      this.ball.respawn({x: 2, y: 1}, 0.05, null);
      this.inProgress = true;
      this.startGameloop();
    }

  }

  stopGame() {

    this.inProgress = false;

  }

  isInProgress() : boolean {

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

  startGameloop() {

    const ticker = setInterval(() => {

      if (this.isInProgress()) {
        this.handleBall();
        let pos : Vector2 | undefined = this.getBallState();

        if (pos) {
          broadcast({ type: "ball_move", ball: pos}, null);
        }

      }
      else {
        clearInterval(ticker);
      }
    }, 33); // 33 milliseconds = ~ 30 frames per sec

  }

  playersAreReady(): boolean {

    if (this.players['left']?.ready && this.players['right']?.ready)
      return true;
    return false;

  }

  getPlayer(side: 'left' | 'right') : PongPlayer | null {

    return this.players[side];

  }

  removePlayer(player: PongPlayer) {

    this.players[player.side] = null;
    this.clients[player.side] = null;

  }

  handlePaddle(side: 'left' | 'right', input: 'up' | 'down') {

    if (this.players[side]) {

        this.paddles[side].update(input);
        this.players[side].paddleY = this.paddles[side].getPaddleY();
    }

  }

  handleBall() {

    let ballPos = this.ball.getPosition();
    let side : string = ballPos.x < 2 ? 'left' : 'right';

    if (!this.players[side] || !this.clients[side]) 
      return;

    if (ballPos.x <= 0 || ballPos.x >= this.tableWidth) { // bounceX & scoring

      if (this.paddles[side].collides(this.ball.getPosition().y)) {
        this.ball.bounceX();
      }
      else {

        this.players[side].score++;
        this.clients['left']?.send(JSON.stringify({type: "score_update", side: side, score: this.players[side].score}));
        this.clients['right']?.send(JSON.stringify({type: "score_update", side: side, score: this.players[side].score}));
        this.stopGame();
        this.countdownTimer();
      } 
    }
    if (ballPos.y <= 0 || ballPos.y >= this.tableHeight) { // bounceY
      this.ball.bounceY();
    }
    this.ball.update();

  }

  getBallState() : Vector2 | undefined {
      return this.ball.getPosition();
  }

  getPaddleState() {

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

  getTableId() : number {
    return this.table;
  }
}
