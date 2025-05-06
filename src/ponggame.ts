import { WebSocket } from '@fastify/websocket';

export default class PongGame {
  // Pong Game data
  private ball: Vector2 = { x: 32 * 2, y: 32 * 1 };
  private playerLeft: PongPlayer | null = null;
  private playerRight: PongPlayer | null = null;
  private clientLeft: WebSocket | null = null;
  private clientRight: WebSocket | null = null;

  // Table data
  private table: number | null = null;
  private inProgress: boolean = false;
  private startTimer: number = 5;
  private tableWidth = 32 * 4;
  private tableHeight = 32 * 2;

  constructor(table: number) {
    this.table = table;
  }

  assignPlayer(player: PongPlayer, client: WebSocket): PongPlayer | null {

    if (player.side === "left") {
      this.playerLeft = player;
      this.playerLeft.paddleY = 32;
      this.playerLeft.ready = true;
      this.playerLeft.score = 0;

      this.clientLeft = client;
      return this.playerLeft;
    }
    else if (player.side === "right") {
      this.playerRight = player;
      this.playerRight.paddleY = 32;
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

  countdownTimer() {

    let sec: number = this.startTimer;

    let timer = setInterval(() => {
      sec--;
      console.log("Sec: ", sec);
      if (this.clientLeft && this.clientRight) {
        this.clientLeft.send(JSON.stringify({ type: "countdown_pong", timer: sec }));
        this.clientRight.send(JSON.stringify({ type: "countdown_pong", timer: sec }));
      }
      if (sec < 0) {
        this.startGame();
        clearInterval(timer);
      }
    }, 1000);

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

  getState() {

    if (this.playerRight && this.playerLeft) {

      return {

        ball: this.ball as Vector2,
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
