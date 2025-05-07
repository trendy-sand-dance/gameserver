
export default class Paddle {
  private paddleY : number;
  private paddleBegin : number;
  private paddleEnd : number;
  private paddleHeight : number;
  private paddleSpeed : number;

  private paddleThreshold : number;

  constructor(paddleY: number, paddleHeight: number, paddleSpeed : number, threshold : number) {

    this.paddleY = paddleY;
    this.paddleHeight = paddleHeight;
    this.paddleBegin = this.paddleY - (paddleHeight / 2);
    this.paddleEnd = this.paddleY + (paddleHeight / 2);
    this.paddleSpeed = paddleSpeed;
    this.paddleThreshold = threshold;

  }

  update(input : 'up' | 'down') {

    if (input === 'up' && this.paddleBegin > 0)
      this.paddleY -= this.paddleSpeed;
    if (input === 'down' && this.paddleEnd < this.paddleThreshold)
      this.paddleY += this.paddleSpeed;

    this.paddleBegin = this.paddleY - (this.paddleHeight / 2);
    this.paddleEnd = this.paddleY + (this.paddleHeight / 2);

  }

  collides(ballY: number) : boolean {

    if (ballY >= this.paddleBegin && ballY <= this.paddleEnd) {
      return true;
    }

    return false;
  }

  getPaddleSpeed() : number {

    return this.paddleSpeed;

  }

  getPaddleHeight() : number {

    return this.paddleHeight;

  }

  getPaddleBegin() : number {

    return this.paddleBegin;

  }

  getPaddleEnd() : number {

    return this.paddleEnd;

  }

  getPaddleY() : number {

    return this.paddleY;

  }

}
