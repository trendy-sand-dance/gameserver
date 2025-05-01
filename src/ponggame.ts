
export default class PongGame {
  // Pong Game data
  private ball: Vector2 = { x: 32 * 2, y: 32 * 1 };
  private playerLeft: PongPlayer | null = null;
  private playerRight: PongPlayer | null = null;

  // Table data
  private table: number | null = null;
  private inProgress: boolean = false;
  private startTimer: number = 5;
  private tableWidth = 32 * 4;
  private tableHeight = 32 * 2;

  constructor(table: number) {
    this.table = table;
  }

  assignPlayer(player: PongPlayer): PongPlayer | null {

    if (player.side === "left") {
      this.playerLeft = player;
      this.playerLeft.paddleY = 32;
      this.playerLeft.ready = true;
      this.playerLeft.score = 0;
      return this.playerLeft;
    }
    else if (player.side === "right") {
      this.playerRight = player;
      this.playerRight.paddleY = 32;
      this.playerRight.ready = true;
      this.playerRight.score = 0;
      return this.playerRight;
    }

    return null;
  }

  getPlayer(side : 'left' | 'right') {
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

    if (side === 'left' && this.playerLeft) {

      if (input === 'up' && this.playerLeft.paddleY > 0) {
        this.playerLeft.paddleY--;
      }
      else if (input === 'down' && this.playerLeft.paddleY < this.tableHeight) {
        this.playerLeft.paddleY++;
      }

    }
    if (side === 'right' && this.playerRight) {

      if (input === 'up' && this.playerRight.paddleY > 0) {
        this.playerRight.paddleY--;
      }
      else if (input === 'down' && this.playerRight.paddleY < this.tableHeight) {
        this.playerRight.paddleY++;
      }

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
