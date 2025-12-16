import { LevelConfig, TileType } from './types';

export const TILE_SIZE = 40;

// Physics Config - "Mario-Style"
// Key Concept: Strong gravity, strong jump, but controllable via input duration.
export const GRAVITY = 0.72; // Reduced gravity (was 0.8) for floatier, longer jumps
export const JUMP_FORCE = -19.0; // Keep high jump force
export const MOVE_SPEED = 5.0; // Increased speed (was 4.2) to jump further
export const MAX_FALL_SPEED = 16; // Terminal velocity is high

export const ACCELERATION = 0.3; // Decreased to 0.3 (was 0.46) for more inertia/slide
export const FRICTION = 0.6; // Higher friction (was 0.35) to reduce sliding
export const AIR_RESISTANCE = 0.05; // Minimal drag in air
export const AIR_CONTROL_ACCEL = 0.4; // Better air control (was 0.3)

// Magic Bullet Config
export const BULLET_SPEED = 6; // Faster bullets (was 5)
export const FIRE_RATE = 45; // Slower fire rate (was 35), frames between shots
export const ENEMY_SPEED = 2;

// Empty Map for Editor (14 rows x 60 cols)
export const DEFAULT_EMPTY_MAP = Array(14).fill("                                                            ");
// Default Start/End for editor convenience
// Mutate the string for default placement
const defaultMapArray = [...DEFAULT_EMPTY_MAP];
defaultMapArray[10] = "   S                                                        ";
defaultMapArray[11] = "XXXXXXX                                                    E";
defaultMapArray[12] = "XXXXXXX                                                  XXX";
defaultMapArray[13] = "XXXXXXX                                                  XXX";
export const EDITOR_INITIAL_MAP = defaultMapArray;


// Level 1: Sunny Meadows
// Removed Boss. Added some simple jumps.
const MAP_LEVEL_1 = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X                                                                                                                                  X",
  "X                                                                                                                                  X",
  "X                                                                                                                                  X",
  "X                                                                                                                                  X",
  "X                                                                                                     ---                          X",
  "X                                                                                                                                  X",
  "X                                                ---                  XXXX                           ---             ---           X",
  "X                                                                    XX  XX               ---                        ---           X",
  "X   S                                                               XX    XX                M              M                       X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   XX  XX    XX    XX           XXXXXXXX   XX    XX    XXXXXXXX    XXXXXXXX    XXXXXXXX    XXXX  E   X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX^^^XX^^XX^^^^XX^^^^XX^^^^^^^^^^^XXXXXXXX^^^XX^^^^XX^^^^XXXXXXXX^^^^XXXXXXXX^^^^XXXXXXXX^^^^XXXXXXXXXXX",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];

// Level 2: Dusty Canyon (Easier Version)
// Concept: Staircase up -> Wings -> Big Glide Down -> Simple Platforms -> End
// Raised ground by 1 tile.
// Lowered Spikes by 1 tile (moved from row 16 to 17).
const MAP_LEVEL_2 = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X                                                                                                                                                    X",
  "X                                                                                                                                                    X",
  "X                                           W                                                                                                        X",
  "X                                          ---                                                                                                       X",
  "X                                                                                                                                                    X",
  "X                                    ---         ---                                                                                                 X",
  "X                                                                                                                                                    X",
  "X                             ---                       ---                                                                                          X",
  "X                                                                                                                 XXX                                X",
  "X                      ---                                                                                       XX XX                               X",
  "X                                                                     ---                                       XX   XX                              X",
  "X               ---                                                                                            XX     XX                             X",
  "X                                                                                       ---                   XX       XX                            X",
  "X         ---                                                                                               XX           XX        M      E          X",
  "X   S                                                                                                      XX             XX      XXXX  XXXXX        X",
  "XXXXXXX                                                                                                    XX             XX      XXXX  XXXXX        X",
  "XXXXXXX^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^XX             XX^^^^^^XXXX^^XXXXX^^^^^^^^X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];

// Level 3: Void Station
// Removed Boss. Kept Portal mechanic.
const MAP_LEVEL_3 = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X                                                                                                                                                                                                          X",
  "X                                                                                                                                                                                                          X",
  "X                                                                                                                                                                                                          X",
  "X                                                                                                                                                                                                          X",
  "X                                                                                                                                             ---                                                          X",
  "X                                                                                                                            ---                                                                           X",
  "X                                                                                                            ---                                            ---                                            X",
  "X                                                                                           ---                                                                                                            X",
  "X                                                                           ---                          ---                                              XXXX                             X",
  "X                                                          ---                                                                                                          XX    XX                           X",
  "X                                                                           W                                                                                         XX        XX                         X",
  "X                                             ---                        ---                                                                                        XX            XX                       X",
  "X                                                                                                                                                                 XX                XX                     X",
  "X                                      ---           ---           ---                  ---        P                                                            XX        M           XX                   X",
  "X                                                                                ---            XXXX           ---           ---                              XX                        XX                 X",
  "X                              ---           M                                         W                                      ---       ---                 XX                            XX               X",
  "X                   XXXX                                                                                                                                  XX                                XX             X",
  "X                  XX  XX                                                                                                                               XX                                    XX           X",
  "X                 XX    XX                                                                                                                            XX                                        XX         X",
  "X       ---      XX      XX               XXXXX          ---            XXXXX          ---           XXXXX          ---         XXXXX               XX              M                             XX       X",
  "X             XXXX        XXXX           XX   XX                       XX   XX                      XX   XX                    XX   XX             XX                                              XX      X",
  "X  S        XXX              XXX       XXX     XXX        M          XXX     XXX                  XXX     XXX                XXX     XXX           XX                                                X  E   X",
  "XXXXXXX^^^^^XX                XX^^^^^^^XX       XX^^^^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^XX                                                XXXXXXX",
  "XXXXXXX^^^^^XX                XX^^^^^^^XX       XX^^^^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^^^^^^XX       XX^^^^^^^^^^^XX                                                XXXXXXX",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];

// Christmas Secret Level
export const MAP_CHRISTMAS_SECRET = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X                                                                                                  X",
  "X                                                                                                  X",
  "X                                                                                                  X",
  "X                                 ---                                                              X",
  "X                          ---           ---                                                       X",
  "X                                                                                                  X",
  "X                    ---                        ---                                                X",
  "X                                                                                                  X",
  "X             ---                                     ---                                          X",
  "X                                                                 ---                              X",
  "X      ---              ^            ^           ^          ---            P                       X",
  "X                  ---  X   ---      X    ---    X    ---                                          X",
  "X   S            XX     X            X           X                                                 X",
  "XXXXXXX^^^^^^^^XX^^^^^^^X^^^^^^^^^^^^X^^^^^^^^^^^X^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];

export const THEME_CHRISTMAS = {
    bg: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900 via-green-900 to-black",
    tile: "bg-white border-red-600 bg-[url('https://www.transparenttextures.com/patterns/snow.png')]", // Faked snow texture via CSS or just white
    accent: "text-red-500"
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Sunny Meadows",
    timeLimit: 45, 
    map: MAP_LEVEL_1,
    theme: {
      bg: "bg-gradient-to-b from-blue-300 to-blue-100",
      tile: "bg-green-500 border-green-700",
      accent: "text-green-700"
    }
  },
  {
    id: 2,
    name: "Dusty Canyon",
    timeLimit: 90, 
    map: MAP_LEVEL_2,
    theme: {
      bg: "bg-gradient-to-b from-orange-200 to-yellow-100",
      tile: "bg-orange-600 border-orange-800",
      accent: "text-orange-800"
    }
  },
  {
    id: 3,
    name: "Void Station",
    timeLimit: 150, 
    map: MAP_LEVEL_3,
    theme: {
      bg: "bg-gradient-to-b from-indigo-900 to-purple-800",
      tile: "bg-purple-500 border-purple-900",
      accent: "text-purple-300"
    }
  }
];