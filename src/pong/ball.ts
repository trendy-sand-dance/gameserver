
export default class Ball {

  public position: Vector2;
  private direction: Vector2;
  private speed: number;

  constructor(position: Vector2, speed : number) {
    this.position = position;
    this.speed = speed;
    this.direction = { x: (Math.random() * 2) - 1, y: (Math.random() * 2) - 1 };
  }

  update() {
    let currentPos: Vector2 = this.position;
    let newPos: Vector2 = { x: currentPos.x + this.direction.x * this.speed, y: currentPos.y + this.direction.y * this.speed}

    this.position = newPos;
  }

  bounceX() {
    this.direction.x = -this.direction.x;
  }

  bounceY() {
    this.direction.y = -this.direction.y;
  }

  getPosition() : Vector2 {
      return this.position;
  }

  setPosition(position: Vector2) {
    this.position = position;
  }

  respawn(position: Vector2, speed : number, direction : Vector2 | null) {

    this.position = position;
    this.speed = speed;

    if (direction === null)
      this.direction = { x: (Math.random() * 2) - 1, y: (Math.random() * 2) - 1 };
    else
      this.direction = direction;

  }

}
