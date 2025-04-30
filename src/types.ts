declare global {


  interface PongPlayer {
    id: number,
    username: string,
    paddleY: number,
    ready: boolean,
    score: number,
    side: string,
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

  interface UserData {
    id: number,
    username: string,
    password: string,
    email: string,
    avatar: string,
    status: boolean,
    player: PlayerData
  }

  interface PlayerData {
    id: number,
    userId: number,
    x: number,
    y: number,
  }

}


