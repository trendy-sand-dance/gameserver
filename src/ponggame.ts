import { WebSocket } from '@fastify/websocket';
import Ball from './pong/ball.js';
import { broadcast } from './controllers/wsGame.controller.js';

export default class PongGame {
  // Pong Game data
    // Ball
  private ball : Ball = new Ball({x: 2, y: 1}, 0.05);

    // Paddle
  private paddleHeight: number = 0.5;

    // Players
  private playerLeft: PongPlayer | null = null;
  private playerRight: PongPlayer | null = null;
  private clientLeft: WebSocket | null = null;
  private clientRight: WebSocket | null = null;

  // Table data
  private table: number;
  private inProgress: boolean = false;
  private startTimer: number = 3;
  private tableWidth = 4;
  private tableHeight = 2;

  constructor(table: number, width : number, height : number) {
    this.table = table;
    this.tableWidth = width;
    this.tableHeight = height;
  }

  assignPlayer(player: PongPlayer, client: WebSocket): PongPlayer | null {

    if (player.side === "left") {
      this.playerLeft = player;
      this.playerLeft.paddleY = this.tableHeight / 2;
      this.playerLeft.ready = true;
      this.playerLeft.score = 0;

      this.clientLeft = client;
      return this.playerLeft;
    }
    else if (player.side === "right") {
      this.playerRight = player;
      this.playerRight.paddleY = this.tableHeight / 2;
      this.playerRight.ready = true;
      this.playerRight.score = 0;

      this.clientRight = client;
      return this.playerRight;
    }

    return null;
  }

  startGame() {
    if (this.clientLeft && this.clientRight) {
      this.clientLeft.send(JSON.stringify({ type: "start_pong_game" }));
      this.clientRight.send(JSON.stringify({ type: "start_pong_game" }));
      this.ball.respawn({x: 2, y: 1}, 0.05, null);
      this.inProgress = true;
      this.startGameloop();
    }
  }

  stopGame() {
    this.inProgress = false;
  }

  isGameInProgress() : boolean {
    return this.inProgress;
  }

  countdownTimer() {

    let sec: number = this.startTimer;

    let timer = setInterval(() => {

      sec--;
      if (this.clientLeft && this.clientRight) {
        this.clientLeft.send(JSON.stringify({ type: "countdown_pong", timer: sec }));
        this.clientRight.send(JSON.stringify({ type: "countdown_pong", timer: sec }));
      }

      if (sec < 0) {
        clearInterval(timer);
        this.startGame();
      }

    }, 1000);

  }

  startGameloop() {

    const ticker = setInterval(() => {

      if (this.isGameInProgress()) {
        this.moveBall();
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
    if (this.playerLeft && this.playerRight)
      return this.playerLeft.ready && this.playerRight.ready;
    return false;
  }

  getPlayer(side: 'left' | 'right') {
    if (side === "left") {
      return this.playerLeft;
    }
    else if (side === "right") {
      return this.playerRight;
    }
  }

  removePlayer(player: PongPlayer) {

    if (player.side === "left") {
      this.playerLeft = null;
    }
    else if (player.side === "right") {
      this.playerRight = null;
    }

  }

  movePaddle(side: 'left' | 'right', input: 'up' | 'down') {
    const paddleSpeed: number = 0.1;

    if (side === 'left' && this.playerLeft) {

      if (input === 'up' && this.playerLeft.paddleY > 0) {
        this.playerLeft.paddleY -= paddleSpeed;
      }
      else if (input === 'down' && this.playerLeft.paddleY < this.tableHeight) {
        this.playerLeft.paddleY += paddleSpeed;
      }

      console.log("Moved paddle (left)", this.playerLeft.paddleY)
    }
    if (side === 'right' && this.playerRight) {

      if (input === 'up' && this.playerRight.paddleY > 0) {
        this.playerRight.paddleY -= paddleSpeed;
      }
      else if (input === 'down' && this.playerRight.paddleY < this.tableHeight) {
        this.playerRight.paddleY += paddleSpeed;
      }

      console.log("Moved paddle (right)", this.playerRight.paddleY)
    }
  }

  collidesWithPaddle(paddleY: number, ballY: number) : boolean {

    let pHeight = this.paddleHeight / 2;
    let pBegin = paddleY - pHeight;
    let pEnd = paddleY + pHeight;

    if (ballY >= pBegin && ballY <= pEnd) {
      return true;
    }

    return false;
  }

  moveBall() {

    let ballPos = this.ball.getPosition();

    if (this.playerLeft && this.playerRight) {

      if (ballPos.x < 0) {

        if (this.collidesWithPaddle(this.playerLeft.paddleY, this.ball.getPosition().y)) {
          this.ball.bounceX();
        }
        else {
          if (this.clientLeft) {
            this.clientLeft.send(JSON.stringify({type: "score_update", side: "left", score: this.playerLeft.score}));
          }
          this.playerLeft.score++;
          this.stopGame();
          this.countdownTimer();
        } 
      }

      if (ballPos.x > this.tableWidth) {

        if (this.collidesWithPaddle(this.playerRight.paddleY, this.ball.getPosition().y)) {
          this.ball.bounceX();
        }
        else {
          if (this.clientRight) {
            this.clientRight.send(JSON.stringify({type: "score_update", side: "left", score: this.playerRight.score}));
          }
          this.playerRight.score++;
          this.stopGame();
          this.countdownTimer();
        }
      }

      if (ballPos.y < 0 || ballPos.y > this.tableHeight) {
        this.ball.bounceY();
      }

      this.ball.update();
    }

  }

  getBallState() : Vector2 | undefined {
      return this.ball.getPosition();
  }

  getPaddleState() {

    if (this.playerRight && this.playerLeft) {

      return {

        paddles: {
          left: this.playerLeft.paddleY as number,
          right: this.playerRight.paddleY as number
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
