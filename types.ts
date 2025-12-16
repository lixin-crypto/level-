
export enum TileType {
  EMPTY = ' ',
  WALL = 'X',
  PLATFORM = '-',
  SPIKE = '^',
  START = 'S',
  END = 'E',
  LAVA = 'L',
  MONSTER = 'M',
  WING = 'W',
  PORTAL = 'P'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlayerState extends Rect {
  vx: number;
  vy: number;
  isGrounded: boolean;
  isDead: boolean;
  hasWon: boolean;
  facingRight: boolean;
  jumpCount: number;
  wingTimeLeft: number; // Milliseconds remaining for wing powerup
}

export interface Bullet extends Rect {
  vx: number;
  id: number; // Unique ID for react keys
  createdAt: number; // Timestamp for fade out logic
}

export interface Enemy extends Rect {
  vx: number;
  id: number;
  isDead: boolean;
}

export interface Item extends Rect {
  id: number;
  type: 'WING';
  isCollected: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  timeLimit: number; // Seconds
  map: string[];
  theme: {
    bg: string;
    tile: string;
    accent: string;
  };
}

export enum GameStatus {
  MENU,
  PLAYING,
  LEVEL_COMPLETE,
  GAME_OVER,
  VICTORY,
  EDITOR
}
