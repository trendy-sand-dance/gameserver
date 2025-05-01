declare global {

  enum Side {
    Left,
    Right,
  }

  interface PongPlayer {
    id: number,
    username: string,
    paddleY: number,
    ready: boolean,
    score: number,
    side: string,
  }

  interface Player { // Related to ServerPlayer (on Client side)
    id: number,
    username: string,
    avatar: string,
    x: number,
    y: number,
  }

  interface Vector2 {
    x: number;
    y: number;
  }

  interface ServerMessage {
    type: string,
    id?: number,
    username?: string,
    avatar?: string,
    position?: Vector2,
  }

}


