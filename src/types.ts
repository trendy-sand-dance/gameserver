import Paddle from './pong/paddle.js';

declare global {

  enum Side {
    Left,
    Right,
  }

  interface PlayerMap {
    left: PongPlayer | null,
    right: PongPlayer | null,
  }

  interface ClientMap {
    left: WebSocket | null,
    right: WebSocket | null,
  }

  interface PaddleMap {
    left: Paddle,
    right: Paddle,
  }

  interface PongPlayer {
    id: number,
    username: string,
    paddleY: number,
    ready: boolean,
    score: number,
    side: string,
  }

  interface TournamentPlayer {
    id: number,
    username: string,
    avatar: string,
    wins: number,
    losses: number,
    local: boolean,
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
export const DATABASE_URL = 'http://database_container:3000';


