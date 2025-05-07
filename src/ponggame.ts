import { WebSocket } from '@fastify/websocket';
import { broadcast } from './controllers/wsGame.controller.js';

export default class PongGame {
  // Pong Game data
    // Ball
  private ball: Vector2 = { x: 2, y: 1 }; // Spawn it in the middle
  private direction: Vector2 = { x: (Math.random() * 2) - 1, y: (Math.random() * 2) - 1 }; // Assign direction between (-1, 1)
  private speed: number = 0.05;



    // Players
  private playerLeft: PongPlayer | null = null;
  private playerRight: PongPlayer | null = null;
  private clientLeft: WebSocket | null = null;
  private clientRight: WebSocket | null = null;

  // Table data
  private table: number | null = null;
  private inProgress: boolean = false;
  private startTimer: number = 3;
  private tableWidth = 4;
  private tableHeight = 2;

  constructor(table: number) {
    this.table = table;
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
      this.inProgress = true;
    }
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
        this.update();
      }
    }, 1000);

  }

  update() {

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

  stopGame() {
    this.inProgress = false;
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

  moveBall() {

    this.updateBall();

    if (this.ball.x < 0 || this.ball.x > this.tableWidth) {
      this.bounceX();
    }

    if (this.ball.y < 0 || this.ball.y > this.tableHeight) {
      this.bounceY();
    }

  }

  updateBall() {
    let currentPos: Vector2 = this.ball;
    let newPos: Vector2 = { x: currentPos.x + this.direction.x * this.speed, y: currentPos.y + this.direction.y * this.speed}

    this.ball = newPos;
  }

  bounceX() {
    this.direction.x = -this.direction.x;
  }

  bounceY() {
    this.direction.y = -this.direction.y;
  }

  getBallState() : Vector2 | undefined {
    if (this.playerRight && this.playerLeft) {
      return this.ball;
    }
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
}
