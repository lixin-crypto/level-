import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { GameStatus, LevelConfig, PlayerState, TileType, Rect, Bullet, Enemy, Item } from '../types';
import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, MAX_FALL_SPEED, ACCELERATION, FRICTION, AIR_RESISTANCE, AIR_CONTROL_ACCEL, BULLET_SPEED, FIRE_RATE, ENEMY_SPEED, MAP_CHRISTMAS_SECRET, THEME_CHRISTMAS } from '../constants';
import { ArrowLeft, ArrowRight, ArrowUp, X } from 'lucide-react';

interface GameEngineProps {
  level: LevelConfig;
  showWingTutorial?: boolean;
  onCloseTutorial?: () => void;
  onLevelComplete: (secretCompleted: boolean) => void;
  onGameOver: () => void;
  onExit: () => void;
}

interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    life: number; 
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    char: string;
    scale: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ level, showWingTutorial = false, onCloseTutorial, onLevelComplete, onGameOver, onExit }) => {
  // --- STATE ---
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [cameraX, setCameraX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [wingActive, setWingActive] = useState(false); 
  const [isTutorialOpen, setIsTutorialOpen] = useState(showWingTutorial);
  
  // Secret Level Logic
  const [isSecretLevel, setIsSecretLevel] = useState(false);
  const [secretCompleted, setSecretCompleted] = useState(false);

  // --- REFS ---
  const playerRef = useRef<PlayerState>({
    x: 0, y: 0, w: 30, h: 30, vx: 0, vy: 0, isGrounded: false, isDead: false, hasWon: false, facingRight: true, jumpCount: 0, wingTimeLeft: 0
  });
  const savedPlayerPosRef = useRef<{x: number, y: number} | null>(null); // To restore position after secret level
  
  const exitRef = useRef<Rect | null>(null); 
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<Item[]>([]); 
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Snow Effect Refs
  const snowCanvasRef = useRef<HTMLCanvasElement>(null);
  const snowParticlesRef = useRef<{x: number, y: number, v: number, size: number, spin: number}[]>([]);
  const snowflakeImageRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const shootTimerRef = useRef(0);
  const bulletIdCounter = useRef(0);
  const enemyIdCounter = useRef(0);
  const itemIdCounter = useRef(0);
  const floatingTextIdCounter = useRef(0);
  const particleIdCounter = useRef(0);

  // Persistent DOM Element Refs
  const bulletElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const enemyElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const itemElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const floatingTextElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const particleElsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const inputRef = useRef({ left: false, right: false, jumpPressed: false, jumpHeld: false });
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const lastFrameTimeRef = useRef<number>(Date.now());
  
  // DOM Refs for Containers
  const playerDivRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bulletsContainerRef = useRef<HTMLDivElement>(null);
  const enemiesContainerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const floatingTextContainerRef = useRef<HTMLDivElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);

  // --- PRE-RENDER SNOWFLAKE ---
  useEffect(() => {
    const cvs = document.createElement('canvas');
    cvs.width = 32;
    cvs.height = 32;
    const ctx = cvs.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '28px sans-serif'; // Bigger font for clearer downscaling
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', 16, 18); // Slight offset for vertical centering
    }
    snowflakeImageRef.current = cvs;
  }, []);

  // --- HANDLE RESIZE ---
  useEffect(() => {
    const handleResize = () => {
        if (snowCanvasRef.current && snowCanvasRef.current.parentElement) {
            const parent = snowCanvasRef.current.parentElement;
            snowCanvasRef.current.width = parent.clientWidth;
            snowCanvasRef.current.height = parent.clientHeight;
            canvasSizeRef.current = { w: parent.clientWidth, h: parent.clientHeight };
        }
    };
    window.addEventListener('resize', handleResize);
    // Call once to init
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      setIsTutorialOpen(showWingTutorial);
  }, [showWingTutorial]);

  const handleCloseTutorial = () => {
      setIsTutorialOpen(false);
      if (onCloseTutorial) onCloseTutorial();
  };

  // Determine which map to use
  const activeMapData = useMemo(() => {
      if (isSecretLevel) return MAP_CHRISTMAS_SECRET;
      return level.map;
  }, [level, isSecretLevel]);

  const activeTheme = useMemo(() => {
      if (isSecretLevel) return THEME_CHRISTMAS;
      return level.theme;
  }, [level, isSecretLevel]);

  // Parse Level Map
  const { tiles, startPos, initialExit, initialEnemies, initialItems, portals } = useMemo(() => {
    const tiles: { type: TileType; rect: Rect }[] = [];
    const initialEnemies: Enemy[] = [];
    const initialItems: Item[] = [];
    const portals: Rect[] = [];

    let startPos = { x: 100, y: 100 };
    let initialExit: Rect | null = null;

    enemyIdCounter.current = 0; 
    itemIdCounter.current = 0;

    activeMapData.forEach((row, rowIndex) => {
      row.split('').forEach((char, colIndex) => {
        const x = colIndex * TILE_SIZE;
        const y = rowIndex * TILE_SIZE;
        
        // If we are in normal level and secret is completed, skip creating the 'P' tile
        if (!isSecretLevel && secretCompleted && char === TileType.PORTAL) {
            return; // Don't spawn portal
        }

        if (char === TileType.START) {
          startPos = { x: x + (TILE_SIZE - 30) / 2, y: y + (TILE_SIZE - 30) };
        } else if (char === TileType.END) {
           initialExit = { x, y, w: TILE_SIZE, h: TILE_SIZE };
        } else if (char === TileType.MONSTER) {
           initialEnemies.push({
             x: x + 5,
             y: y + 10,
             w: 30,
             h: 30,
             vx: ENEMY_SPEED,
             id: enemyIdCounter.current++,
             isDead: false
           });
        } else if (char === TileType.WING) {
            initialItems.push({
                x: x, y: y, w: TILE_SIZE, h: TILE_SIZE,
                id: itemIdCounter.current++,
                type: 'WING',
                isCollected: false
            });
        } else if (char === TileType.PORTAL) {
            portals.push({
                x, y, w: TILE_SIZE, h: TILE_SIZE
            });
        } else if (char !== TileType.EMPTY) {
          tiles.push({
            type: char as TileType,
            rect: { x, y, w: TILE_SIZE, h: TILE_SIZE }
          });
          
          // Random items in normal levels only
          if (!isSecretLevel && char === TileType.PLATFORM && (level.id === 2 || level.id === 3)) {
             if (Math.random() < 0.10) {
                 initialItems.push({
                    x: x, 
                    y: y - TILE_SIZE, 
                    w: TILE_SIZE, h: TILE_SIZE,
                    id: itemIdCounter.current++,
                    type: 'WING',
                    isCollected: false
                });
             }
          }
        }
      });
    });
    return { tiles, startPos, initialExit, initialEnemies, initialItems, portals };
  }, [activeMapData, isSecretLevel, secretCompleted, level.id]);

  // Reset Entity Logic
  useEffect(() => {
    if (isSecretLevel) {
        playerRef.current.x = startPos.x;
        playerRef.current.y = startPos.y;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
    } else if (savedPlayerPosRef.current && secretCompleted) {
        playerRef.current.x = savedPlayerPosRef.current.x;
        playerRef.current.y = savedPlayerPosRef.current.y;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
        savedPlayerPosRef.current = null; 
    } else if (!savedPlayerPosRef.current) {
        playerRef.current.x = startPos.x;
        playerRef.current.y = startPos.y;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
        playerRef.current.wingTimeLeft = 0;
        playerRef.current.isDead = false;
        playerRef.current.hasWon = false;
        setWingActive(false);
    }
    
    bulletsRef.current = [];
    enemiesRef.current = JSON.parse(JSON.stringify(initialEnemies));
    itemsRef.current = JSON.parse(JSON.stringify(initialItems));
    floatingTextsRef.current = [];
    particlesRef.current = [];
    // Reset snow particles on level load if needed, or keep them if persisting within same GameEngine mount
    if (!secretCompleted) snowParticlesRef.current = [];

    shootTimerRef.current = 0;

    if (bulletsContainerRef.current) bulletsContainerRef.current.innerHTML = '';
    if (enemiesContainerRef.current) enemiesContainerRef.current.innerHTML = '';
    if (itemsContainerRef.current) itemsContainerRef.current.innerHTML = '';
    if (floatingTextContainerRef.current) floatingTextContainerRef.current.innerHTML = '';
    if (particlesContainerRef.current) particlesContainerRef.current.innerHTML = '';
    
    bulletElsRef.current.clear();
    enemyElsRef.current.clear();
    itemElsRef.current.clear();
    floatingTextElsRef.current.clear();
    particleElsRef.current.clear();

    exitRef.current = initialExit; 

    if (!savedPlayerPosRef.current && !isSecretLevel && !secretCompleted) {
        startTimeRef.current = Date.now();
        setTimeLeft(level.timeLimit);
    }

    lastFrameTimeRef.current = Date.now();
    setIsPaused(false);
    
  }, [tiles, startPos, initialExit, initialEnemies, initialItems, isSecretLevel, secretCompleted, level.id]);

  useEffect(() => {
      setIsSecretLevel(false);
      setSecretCompleted(false);
      savedPlayerPosRef.current = null;
      snowParticlesRef.current = []; // Clear snow when switching levels
  }, [level.id]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
         if (!e.repeat) {
             inputRef.current.jumpPressed = true;
             // Christmas Particles on Jump: Enable if inside Secret Level OR if Secret Level completed
             if ((isSecretLevel || secretCompleted) && (playerRef.current.isGrounded || playerRef.current.jumpCount < 2)) {
                 spawnChristmasParticles(playerRef.current.x + playerRef.current.w/2, playerRef.current.y + playerRef.current.h);
             }
         }
         inputRef.current.jumpHeld = true; 
         if(e.key === ' ') e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') inputRef.current.jumpHeld = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSecretLevel, secretCompleted]);

  const spawnChristmasParticles = (x: number, y: number) => {
      const chars = ['❄️', '🎄', '✨', '🎁'];
      for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
              id: particleIdCounter.current++,
              x: x,
              y: y,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              life: 40 + Math.random() * 20,
              char: chars[Math.floor(Math.random() * chars.length)],
              scale: 0.5 + Math.random() * 0.5
          });
      }
  };

  const checkCollision = (r1: Rect, r2: Rect) => {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  };

  const syncDomEntities = <T extends { id: number, x: number, y: number }>(
      entities: T[], 
      mapRef: React.MutableRefObject<Map<number, HTMLDivElement>>, 
      container: HTMLDivElement | null,
      createFn: (entity: T) => HTMLDivElement,
      updateFn?: (el: HTMLDivElement, entity: T) => void,
      filterFn?: (entity: T) => boolean
  ) => {
      if (!container) return;
      const activeIds = new Set<number>();
      entities.forEach(entity => {
          if (filterFn && !filterFn(entity)) return;
          activeIds.add(entity.id);
          let el = mapRef.current.get(entity.id);
          if (!el) {
              el = createFn(entity);
              container.appendChild(el);
              mapRef.current.set(entity.id, el);
          }
          el.style.transform = `translate(${entity.x}px, ${entity.y}px)`;
          if (updateFn) updateFn(el, entity);
      });
      for (const [id, el] of mapRef.current) {
          if (!activeIds.has(id)) {
              el.remove();
              mapRef.current.delete(id);
          }
      }
  };

  const animate = useCallback((time: number) => {
    if (isPaused || isTutorialOpen || playerRef.current.hasWon || playerRef.current.isDead) {
        lastFrameTimeRef.current = Date.now(); // Keep clock updating to avoid big jumps on resume
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const now = Date.now();
    const deltaTime = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    const player = playerRef.current;
    
    // Time
    const elapsed = (now - startTimeRef.current) / 1000;
    const remaining = Math.max(0, level.timeLimit - elapsed);
    if (Math.ceil(remaining) !== Math.ceil(timeLeft)) setTimeLeft(remaining);
    if (remaining <= 0) {
      player.isDead = true;
      onGameOver();
      return;
    }

    // Wing Timer
    if (player.wingTimeLeft > 0) {
        player.wingTimeLeft -= deltaTime;
        if (player.wingTimeLeft <= 0) {
            player.wingTimeLeft = 0;
            setWingActive(false);
        } else {
            if (!wingActive) setWingActive(true);
        }
    }

    // --- PHYSICS UPDATE ---

    // 1. Determine Acceleration & Friction based on State
    const currentAccel = player.isGrounded ? ACCELERATION : AIR_CONTROL_ACCEL;
    // Key fix: Low friction in air to preserve momentum, high friction on ground for stopping
    const currentFriction = player.isGrounded ? FRICTION : AIR_RESISTANCE;

    // 2. Horizontal Movement
    if (inputRef.current.left) {
        if (player.vx > 0) {
             // Turn fast
             player.vx -= currentAccel * 2.0; 
        } else {
             player.vx -= currentAccel;
        }
        
        if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;
        player.facingRight = false;
    } else if (inputRef.current.right) {
        if (player.vx < 0) {
             // Turn fast
             player.vx += currentAccel * 2.0;
        } else {
             player.vx += currentAccel;
        }

        if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
        player.facingRight = true;
    } else {
        // Apply friction when no input
        if (player.vx > 0) {
            player.vx -= currentFriction;
            if (player.vx < 0) player.vx = 0;
        } else if (player.vx < 0) {
            player.vx += currentFriction;
            if (player.vx > 0) player.vx = 0;
        }
    }

    // 3. Jump Logic
    if (inputRef.current.jumpPressed) {
        if (player.isGrounded) {
            player.vy = JUMP_FORCE;
            player.isGrounded = false;
            player.jumpCount = 1;
        } else if (player.jumpCount < 2) {
            player.vy = JUMP_FORCE; // Double jump is same strength
            player.jumpCount++;
        }
        inputRef.current.jumpPressed = false;
    }

    // 4. Vertical Movement
    // Gliding
    let appliedGravity = GRAVITY;

    // Mario Logic: Variable Jump Height
    // If moving UP and NOT holding jump, apply EXTRA gravity to cut jump short.
    if (player.vy < 0 && !inputRef.current.jumpHeld) {
        appliedGravity = GRAVITY * 2.5; 
    }

    if (player.wingTimeLeft > 0 && player.vy > 0 && inputRef.current.jumpHeld) {
        player.vy = 2; // Slow fall for glide
    } else {
        player.vy += appliedGravity;
        if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;
    }

    // X Collision
    player.x += player.vx;
    let playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const tile of tiles) {
      if (checkCollision(playerRect, tile.rect)) {
        if (tile.type === TileType.SPIKE || tile.type === TileType.LAVA) {
          player.isDead = true;
          onGameOver();
          return;
        }
        if (tile.type === TileType.WALL || tile.type === TileType.PLATFORM) {
          if (player.vx > 0) player.x = tile.rect.x - player.w;
          else if (player.vx < 0) player.x = tile.rect.x + tile.rect.w;
          player.vx = 0;
        }
      }
    }

    // Y Collision
    player.y += player.vy;
    player.isGrounded = false;
    playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const tile of tiles) {
      if (checkCollision(playerRect, tile.rect)) {
        if (tile.type === TileType.SPIKE || tile.type === TileType.LAVA) {
           player.isDead = true;
           onGameOver();
           return;
        }
        if (tile.type === TileType.WALL || tile.type === TileType.PLATFORM) {
          if (player.vy > 0) {
            player.y = tile.rect.y - player.h;
            player.isGrounded = true;
            player.vy = 0;
            player.jumpCount = 0; 
          } else if (player.vy < 0 && tile.type !== TileType.PLATFORM) {
            player.y = tile.rect.y + tile.rect.h;
            player.vy = 0;
          }
        }
      }
    }

    if (player.y > (activeMapData.length * TILE_SIZE) + 200) {
      player.isDead = true;
      onGameOver();
      return;
    }

    // Portal Collision
    for (const portal of portals) {
        if (checkCollision(playerRect, portal)) {
            if (isSecretLevel) {
                setSecretCompleted(true);
                setIsSecretLevel(false);
            } else {
                savedPlayerPosRef.current = { x: player.x, y: player.y };
                setIsSecretLevel(true);
            }
            return; 
        }
    }

    // Bullets
    shootTimerRef.current++;
    if (shootTimerRef.current >= FIRE_RATE) {
        shootTimerRef.current = 0;
        bulletsRef.current.push({
            x: player.x + (player.w / 2) - 5,
            y: player.y + (player.h / 2) - 5,
            w: 10,
            h: 10,
            vx: player.facingRight ? BULLET_SPEED : -BULLET_SPEED,
            id: bulletIdCounter.current++,
            createdAt: Date.now()
        });
    }

    bulletsRef.current.forEach(b => { b.x += b.vx; });
    bulletsRef.current = bulletsRef.current.filter(b => {
        if (Date.now() - b.createdAt > 1000) return false;
        const bulletRect = { x: b.x, y: b.y, w: b.w, h: b.h };
        for (const tile of tiles) {
            if (tile.type === TileType.WALL && checkCollision(bulletRect, tile.rect)) return false;
        }
        return true;
    });

    // Enemies
    enemiesRef.current.forEach(enemy => {
        if (enemy.isDead) return;
        enemy.x += enemy.vx;
        const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
        let turnAround = false;
        for (const tile of tiles) {
            if (checkCollision(enemyRect, tile.rect) && tile.type !== TileType.MONSTER && tile.type !== TileType.WING && tile.type !== TileType.PORTAL) { 
                 turnAround = true;
                 if (enemy.vx > 0) enemy.x = tile.rect.x - enemy.w;
                 else enemy.x = tile.rect.x + tile.rect.w;
            }
        }
        if (!turnAround) {
            const lookAheadX = enemy.vx > 0 ? enemy.x + enemy.w + 5 : enemy.x - 5;
            const lookAheadY = enemy.y + enemy.h + 5;
            let hasFloor = false;
            const checkRect = { x: lookAheadX, y: lookAheadY, w: 2, h: 2 };
            for (const tile of tiles) {
                if ((tile.type === TileType.WALL || tile.type === TileType.PLATFORM) && checkCollision(checkRect, tile.rect)) {
                    hasFloor = true;
                    break;
                }
            }
            if (!hasFloor) turnAround = true;
        }
        if (turnAround) enemy.vx *= -1;
        if (checkCollision(playerRect, enemyRect)) {
            player.isDead = true;
            onGameOver();
            return;
        }
    });
    
    // Items
    itemsRef.current.forEach(item => {
        if (item.isCollected) return;
        if (checkCollision(playerRect, item)) {
            if (item.type === 'WING') {
                item.isCollected = true;
                player.wingTimeLeft = 10000; 
                setWingActive(true);
                floatingTextsRef.current.push({
                    id: floatingTextIdCounter.current++,
                    x: player.x,
                    y: player.y - 20,
                    text: 'WINGS!',
                    life: 60
                });
            }
        }
    });

    // Particles
    particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Floating Texts
    floatingTextsRef.current.forEach(ft => {
        ft.y -= 1;
        ft.life--;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);


    // Collisions (Bullets vs Enemies) - Boss Logic Removed
    const activeBullets: Bullet[] = [];
    for (const b of bulletsRef.current) {
        let bulletHit = false;
        const bRect = { x: b.x, y: b.y, w: b.w, h: b.h };
        for (const enemy of enemiesRef.current) {
            if (!enemy.isDead && checkCollision(bRect, enemy)) {
                enemy.isDead = true;
                bulletHit = true;
                break;
            }
        }
        if (!bulletHit) activeBullets.push(b);
    }
    bulletsRef.current = activeBullets;

    if (exitRef.current) {
        if (checkCollision(playerRect, exitRef.current)) {
            if (isSecretLevel) {
                 setSecretCompleted(true);
                 setIsSecretLevel(false);
            } else {
                player.hasWon = true;
                onLevelComplete(secretCompleted); // Pass secret completion status
            }
            return;
        }
    }

    // --- OPTIMIZED SNOW EFFECT ---
    if (secretCompleted && snowCanvasRef.current && snowflakeImageRef.current) {
        const ctx = snowCanvasRef.current.getContext('2d');
        const { w, h } = canvasSizeRef.current;
        
        if (ctx && w > 0 && h > 0) {
            ctx.clearRect(0, 0, w, h);
            
            // Spawn snow
            if (snowParticlesRef.current.length < 150) {
                 snowParticlesRef.current.push({
                     x: Math.random() * w,
                     y: -20,
                     v: Math.random() * 2 + 1,
                     size: Math.random() * 15 + 10,
                     spin: Math.random() * Math.PI * 2
                 });
            }

            snowParticlesRef.current.forEach(p => {
                p.y += p.v;
                p.spin += 0.01;
                if (p.y > h) {
                    p.y = -20;
                    p.x = Math.random() * w;
                }
                
                // Use drawImage instead of fillText for performance
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.spin);
                const size = p.size;
                ctx.drawImage(snowflakeImageRef.current!, -size/2, -size/2, size, size);
                ctx.restore();
            });
        }
    }

    // DOM Updates
    if (containerRef.current) {
        const viewportW = containerRef.current.clientWidth;
        let targetCamX = player.x - viewportW / 2 + player.w / 2;
        const maxCamX = (activeMapData[0].length * TILE_SIZE) - viewportW;
        targetCamX = Math.max(0, Math.min(targetCamX, maxCamX));
        setCameraX(prev => prev + (targetCamX - prev) * 0.1);
    }

    if (playerDivRef.current) {
        playerDivRef.current.style.transform = `translate(${player.x}px, ${player.y}px)`;
        const eyes = playerDivRef.current.querySelectorAll('.eye');
        eyes.forEach((eye) => {
            (eye as HTMLElement).style.transform = player.facingRight ? 'translateX(2px)' : 'translateX(-2px)';
        });
        
        if (player.wingTimeLeft > 0 && player.wingTimeLeft < 2000) {
             const blink = Math.floor(Date.now() / 100) % 2 === 0;
             playerDivRef.current.style.filter = blink ? 'drop-shadow(0 0 10px yellow)' : 'none';
        } else {
             playerDivRef.current.style.filter = 'none';
        }
    }
    
    // Sync Entity DOMs
    syncDomEntities<Bullet>(bulletsRef.current, bulletElsRef, bulletsContainerRef.current, (b) => {
        const el = document.createElement('div');
        el.className = 'absolute w-3 h-3 bg-red-500 rounded-full shadow-[0_0_5px_red] border border-white';
        return el;
    });

    syncDomEntities<Enemy>(enemiesRef.current, enemyElsRef, enemiesContainerRef.current, (e) => {
        const el = document.createElement('div');
        el.className = 'absolute bg-purple-600 border-2 border-black rounded-t-xl rounded-b-md flex items-center justify-center';
        el.style.width = `${e.w}px`;
        el.style.height = `${e.h}px`;
        el.innerHTML = `
            <div class="w-2 h-2 bg-yellow-300 rounded-full border border-black absolute top-2 left-1"></div>
            <div class="w-2 h-2 bg-yellow-300 rounded-full border border-black absolute top-2 right-1"></div>
            <div class="w-4 h-1 bg-black absolute bottom-2 rounded-full"></div>
        `;
        return el;
    }, undefined, (e) => !e.isDead);

    syncDomEntities<Item>(itemsRef.current, itemElsRef, itemsContainerRef.current, (item) => {
        const el = document.createElement('div');
        el.className = 'absolute flex items-center justify-center';
        el.style.zIndex = '30'; 
        el.style.width = `${item.w}px`;
        el.style.height = `${item.h}px`;
        el.innerHTML = `
            <div style="width: 40px; height: 40px; background: #06b6d4; border: 3px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #06b6d4; animation: pulse 1s infinite;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4C8 4 4 8 4 13C4 18 12 22 12 22C12 22 20 18 20 13C20 9 16 4 12 4Z" fill="white"/>
                    <path d="M2 12C4 10 7 9 10 11" stroke="black" stroke-width="2" stroke-linecap="round"/>
                    <path d="M22 12C20 10 17 9 14 11" stroke="black" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
        `;
        return el;
    }, undefined, (item) => !item.isCollected);

    syncDomEntities<FloatingText>(floatingTextsRef.current, floatingTextElsRef, floatingTextContainerRef.current, (ft) => {
        const el = document.createElement('div');
        el.className = 'absolute font-toon font-bold text-white text-lg drop-shadow-[2px_2px_0_#000]';
        el.innerText = ft.text;
        return el;
    }, (el, ft) => {
        el.style.opacity = (ft.life / 60).toString();
    });

    syncDomEntities<Particle>(particlesRef.current, particleElsRef, particlesContainerRef.current, (p) => {
        const el = document.createElement('div');
        el.className = 'absolute text-4xl select-none drop-shadow-md';
        el.innerText = p.char;
        return el;
    }, (el, p) => {
        el.style.opacity = (p.life / 60).toString();
        el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.scale})`;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, isTutorialOpen, level, onGameOver, onLevelComplete, timeLeft, tiles, wingActive, isSecretLevel, secretCompleted, activeMapData]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const renderTutorialHints = () => {
      if (level.id !== 1 || isSecretLevel) return null;
      
      // Coordinates approximate based on MAP_LEVEL_1 structure in constants
      return (
          <>
            <div className="absolute text-white font-bold text-xl drop-shadow-[2px_2px_0_#000] animate-bounce" style={{ left: 150, top: 300 }}>
                ← Move →
            </div>
            <div className="absolute text-white font-bold text-xl drop-shadow-[2px_2px_0_#000] animate-pulse" style={{ left: 680, top: 300 }}>
                Jump ⇡
            </div>
             <div className="absolute text-white font-bold text-xl drop-shadow-[2px_2px_0_#000]" style={{ left: 1300, top: 250 }}>
                Hold Jump!
            </div>
          </>
      )
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-900 overflow-hidden font-toon select-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full z-20 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex gap-4">
            <div className="bg-white border-4 border-black rounded-xl p-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-gray-500 text-xs uppercase block font-body">Level</span>
                <span className="text-2xl text-black">{isSecretLevel ? "SECRET" : level.name}</span>
            </div>
            <div className={`bg-white border-4 border-black rounded-xl p-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${timeLeft < 10 ? 'animate-pulse text-red-500' : ''}`}>
                <span className="text-gray-500 text-xs uppercase block font-body">Time</span>
                <span className="text-2xl">{Math.ceil(timeLeft)}s</span>
            </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
             <button onClick={onExit} className="bg-red-500 hover:bg-red-400 text-white border-4 border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                <X size={24} />
            </button>
        </div>
      </div>
      
      {/* Wing Tutorial Modal */}
      {isTutorialOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white border-4 border-black rounded-2xl p-6 max-w-sm text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4">
                  <h3 className="text-2xl text-toon-blue">New Ability!</h3>
                   <div style={{
                        width: '60px', 
                        height: '60px', 
                        background: '#06b6d4', 
                        border: '3px solid #FFFFFF', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 0 15px #06b6d4'
                    }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4C8 4 4 8 4 13C4 18 12 22 12 22C12 22 20 18 20 13C20 9 16 4 12 4Z" fill="white"/>
                            <path d="M2 12C4 10 7 9 10 11" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M22 12C20 10 17 9 14 11" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                  <p className="font-body text-gray-700">
                      Pick up this icon. Hold <span className="font-bold">JUMP</span> after a double jump to glide for 10s.
                  </p>
                  <button onClick={handleCloseTutorial} className="px-6 py-2 bg-toon-green text-white border-2 border-black rounded-lg hover:bg-green-400 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                      GOT IT!
                  </button>
              </div>
          </div>
      )}

      {/* Game World Container */}
      <div 
        ref={containerRef}
        className={`flex-1 relative overflow-hidden ${activeTheme.bg}`}
      >
        <div 
          className="absolute top-0 left-0 h-full will-change-transform"
          style={{ transform: `translateX(${-cameraX}px)` }}
        >
          {/* Tiles */}
          {tiles.map((tile, i) => {
             if (tile.type === TileType.WALL) {
                 return (
                     <div key={i} className={`absolute ${activeTheme.tile} border-4 rounded-lg shadow-inner`}
                        style={{ left: tile.rect.x, top: tile.rect.y, width: tile.rect.w, height: tile.rect.h }} />
                 )
             }
             if (tile.type === TileType.PLATFORM) {
                return (
                    <div key={i} className={`absolute ${activeTheme.tile} border-4 rounded-full h-4 mt-2`}
                       style={{ left: tile.rect.x, top: tile.rect.y, width: tile.rect.w, height: 16 }} />
                )
            }
             if (tile.type === TileType.SPIKE) {
                 return (
                    <div key={i} className="absolute text-red-600 flex justify-center items-end"
                        style={{ left: tile.rect.x, top: tile.rect.y, width: tile.rect.w, height: tile.rect.h }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2L2 22h20L12 2z" /></svg>
                    </div>
                 )
             }
             return null;
          })}

          {/* Portals */}
          {portals.map((p, i) => (
              <div key={`portal-${i}`} className="absolute flex items-center justify-center z-10"
                   style={{ left: p.x, top: p.y, width: p.w, height: p.h }}>
                   <div className="w-full h-full rounded-full border-4 border-white bg-black overflow-hidden relative animate-spin-slow">
                       <div className="absolute inset-0 bg-[conic-gradient(from_0deg,red,green,white,red)] opacity-80 blur-sm"></div>
                   </div>
              </div>
          ))}
          
          {/* Exit (Normal Level End) - Only show if not secret level */}
          {exitRef.current && !isSecretLevel && (
             <div className="absolute flex flex-col items-center justify-end z-10"
                 style={{ left: exitRef.current.x, top: exitRef.current.y, width: exitRef.current.w, height: exitRef.current.h }}>
                <div className="h-full w-1 bg-gray-700 absolute bottom-0 left-2 rounded-t-sm"></div>
                <div className="absolute top-2 left-2.5 w-8 h-6 bg-red-500 border-2 border-black origin-left animate-pulse flex items-center justify-center">
                    <div className="text-[10px] font-bold text-white tracking-tighter">WIN</div>
                </div>
                <div className="w-6 h-2 bg-gray-500 border-2 border-black absolute bottom-0 left-0 rounded-sm"></div>
            </div>
          )}
          
          {/* Tutorial Hints */}
          {renderTutorialHints()}

          {/* Dynamic Entities Layer - Force Full Size */}
          <div ref={enemiesContainerRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"></div>
          <div ref={itemsContainerRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"></div>
          <div ref={bulletsContainerRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"></div>
          <div ref={particlesContainerRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"></div>
          <div ref={floatingTextContainerRef} className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none"></div>

          {/* Player */}
          <div 
            ref={playerDivRef}
            className="absolute z-20 w-[30px] h-[30px] bg-toon-yellow border-4 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center gap-1 overflow-visible"
            style={{ left: 0, top: 0, transition: 'none' }}
          >
             <div className="eye w-2 h-2 bg-black rounded-full transition-transform"></div>
             <div className="eye w-2 h-2 bg-black rounded-full transition-transform"></div>
             
             {wingActive && (
                 <>
                    <div className="absolute -left-4 top-1 w-5 h-3 bg-white border-2 border-black rounded-l-full rotate-[-20deg] origin-right animate-pulse"></div>
                    <div className="absolute -right-4 top-1 w-5 h-3 bg-white border-2 border-black rounded-r-full rotate-[20deg] origin-left animate-pulse"></div>
                 </>
             )}
          </div>
        </div>
      </div>

      {/* Snow Overlay for Secret Completion */}
      <canvas ref={snowCanvasRef} className="absolute inset-0 z-50 pointer-events-none" />

      {/* Mobile Controls */}
      <div className="h-48 w-full bg-black/20 backdrop-blur-sm p-4 grid grid-cols-3 gap-4 md:hidden z-30">
        <div className="col-span-1 flex items-center justify-center gap-4">
             <button 
                className="w-16 h-16 bg-white border-b-4 border-black rounded-full shadow-lg active:border-b-0 active:translate-y-1 flex items-center justify-center"
                onTouchStart={(e) => { e.preventDefault(); inputRef.current.left = true; }}
                onTouchEnd={(e) => { e.preventDefault(); inputRef.current.left = false; }}
             >
                <ArrowLeft className="text-black" size={32} />
             </button>
             <button 
                className="w-16 h-16 bg-white border-b-4 border-black rounded-full shadow-lg active:border-b-0 active:translate-y-1 flex items-center justify-center"
                onTouchStart={(e) => { e.preventDefault(); inputRef.current.right = true; }}
                onTouchEnd={(e) => { e.preventDefault(); inputRef.current.right = false; }}
             >
                <ArrowRight className="text-black" size={32} />
             </button>
        </div>
        <div className="col-span-2 flex items-center justify-end pr-8">
            <button 
                className="w-24 h-24 bg-toon-green border-b-8 border-green-900 rounded-full shadow-xl active:border-b-0 active:translate-y-2 flex items-center justify-center"
                onTouchStart={(e) => { e.preventDefault(); inputRef.current.jumpPressed = true; inputRef.current.jumpHeld = true; }}
                onTouchEnd={(e) => { e.preventDefault(); inputRef.current.jumpHeld = false; }}
             >
                <ArrowUp className="text-white" size={48} />
             </button>
        </div>
      </div>
    </div>
  );
};