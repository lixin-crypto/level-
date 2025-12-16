import React, { useState, useRef, useEffect } from 'react';
import { GameStatus, LevelConfig } from './types';
import { LEVELS, EDITOR_INITIAL_MAP } from './constants';
import { GameEngine } from './components/GameEngine';
import { LevelEditor } from './components/LevelEditor';
import { Play, Trophy, Skull, Lock, Star, Edit, Hammer } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  
  // Custom Level State
  const [customMap, setCustomMap] = useState<string[]>(EDITOR_INITIAL_MAP);
  
  // New States for requested features
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [secretFound, setSecretFound] = useState(false);

  // Construct level config dynamically
  const getCurrentLevelConfig = (): LevelConfig => {
      if (currentLevelId === 99) {
          return {
              id: 99,
              name: "Custom Level",
              timeLimit: 120,
              map: customMap,
              theme: {
                  bg: "bg-gray-800",
                  tile: "bg-gray-600 border-gray-400",
                  accent: "text-gray-400"
              }
          };
      }
      return LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
  };

  const handleStartLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setStatus(GameStatus.PLAYING);
  };

  const handleLevelComplete = (secretCompleted: boolean) => {
    if (secretCompleted) {
        setSecretFound(true);
    }
    setStatus(GameStatus.LEVEL_COMPLETE);
    if (currentLevelId !== 99 && !unlockedLevels.includes(currentLevelId + 1) && currentLevelId < LEVELS.length) {
      setUnlockedLevels([...unlockedLevels, currentLevelId + 1]);
    }
  };

  const handleGameOver = () => {
    setStatus(GameStatus.GAME_OVER);
  };

  const handleNextLevel = () => {
    if (currentLevelId === 99) {
        // If testing custom level, go back to editor
        setStatus(GameStatus.EDITOR);
        return;
    }
    if (currentLevelId < LEVELS.length) {
      setCurrentLevelId(currentLevelId + 1);
      setStatus(GameStatus.PLAYING);
    } else {
      setStatus(GameStatus.VICTORY);
    }
  };

  const handleExit = () => {
    if (currentLevelId === 99) {
        setStatus(GameStatus.EDITOR);
    } else {
        setStatus(GameStatus.MENU);
    }
  };

  const handleTutorialClose = () => {
      setTutorialSeen(true);
  };
  
  // Editor Handlers
  const handleOpenEditor = () => {
      setStatus(GameStatus.EDITOR);
  };

  const handleTestCustomLevel = (newMap: string[]) => {
      setCustomMap(newMap);
      setCurrentLevelId(99);
      setStatus(GameStatus.PLAYING);
  };

  // --- Screens ---

  const MenuScreen = () => (
    <div className="min-h-screen bg-toon-purple flex flex-col items-center justify-center p-4 font-toon relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-toon-pink rounded-full opacity-50 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-toon-blue rounded-full opacity-50 blur-xl"></div>

        <div className="z-10 text-center space-y-8 max-w-2xl w-full">
            <h1 className="text-6xl md:text-8xl text-white drop-shadow-[4px_4px_0_#000] -rotate-2">
                TOON <span className="text-toon-yellow">HOP</span>
            </h1>
            <p className="text-xl text-white font-body bg-black/20 p-2 rounded-lg inline-block">Jump your way through 3 cartoon worlds!</p>
            
            <div className="grid gap-4 w-full">
                {LEVELS.map((level) => {
                    const isUnlocked = unlockedLevels.includes(level.id);
                    return (
                        <button 
                            key={level.id}
                            disabled={!isUnlocked}
                            onClick={() => handleStartLevel(level.id)}
                            className={`
                                group relative w-full p-4 rounded-2xl border-4 border-black transition-all transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none
                                ${isUnlocked ? 'bg-white cursor-pointer' : 'bg-gray-400 cursor-not-allowed opacity-75'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-xl
                                        ${isUnlocked ? 'bg-toon-blue text-white' : 'bg-gray-600 text-gray-400'}
                                    `}>
                                        {isUnlocked ? level.id : <Lock size={20}/>}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-2xl text-black">{level.name}</div>
                                        <div className="text-gray-500 text-sm font-body">{level.timeLimit} seconds challenge</div>
                                    </div>
                                </div>
                                {isUnlocked && <Play className="text-black group-hover:scale-110 transition-transform" size={32} fill="currentColor" />}
                            </div>
                        </button>
                    )
                })}

                {/* Level Editor Button - Placed below Level 3 */}
                <button 
                    onClick={handleOpenEditor}
                    className="group relative w-full p-4 rounded-2xl border-4 border-black bg-orange-400 transition-all transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-xl bg-yellow-300 text-black">
                                <Hammer size={24}/>
                            </div>
                            <div className="text-left">
                                <div className="text-2xl text-white drop-shadow-md">Level Editor</div>
                                <div className="text-orange-100 text-sm font-body">Create your own challenge!</div>
                            </div>
                        </div>
                        <Edit className="text-white group-hover:scale-110 transition-transform" size={32} />
                    </div>
                </button>
            </div>
        </div>
    </div>
  );

  const GameOverScreen = () => (
    <div className="min-h-screen bg-gray-900/90 flex flex-col items-center justify-center p-4 font-toon text-white z-50">
        <Skull size={80} className="text-red-500 mb-4 animate-bounce" />
        <h2 className="text-6xl mb-2 text-red-500 drop-shadow-[4px_4px_0_#000]">OOPS!</h2>
        <p className="text-2xl mb-8 font-body">You fell or ran out of time.</p>
        <div className="flex gap-4">
            <button onClick={handleExit} className="px-8 py-3 bg-gray-600 border-4 border-black rounded-xl hover:bg-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {currentLevelId === 99 ? 'Editor' : 'Menu'}
            </button>
            <button onClick={() => setStatus(GameStatus.PLAYING)} className="px-8 py-3 bg-toon-green border-4 border-black rounded-xl hover:bg-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                Try Again
            </button>
        </div>
    </div>
  );

  const LevelCompleteScreen = () => (
    <div className="min-h-screen bg-toon-yellow flex flex-col items-center justify-center p-4 font-toon text-black z-50">
        <Star size={80} className="text-white mb-4 animate-spin-slow drop-shadow-md" />
        <h2 className="text-6xl mb-2 text-white drop-shadow-[4px_4px_0_#000]">{currentLevelId === 99 ? 'TEST CLEAR!' : 'LEVEL CLEAR!'}</h2>
        <p className="text-2xl mb-8 font-body">Great jumping!</p>
        <div className="flex gap-4">
            <button onClick={handleExit} className="px-8 py-3 bg-white border-4 border-black rounded-xl hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {currentLevelId === 99 ? 'Editor' : 'Menu'}
            </button>
            {currentLevelId !== 99 && (
                <button onClick={handleNextLevel} className="px-8 py-3 bg-toon-blue text-white border-4 border-black rounded-xl hover:bg-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    {currentLevelId < LEVELS.length ? 'Next Level' : 'Finish'}
                </button>
            )}
        </div>
    </div>
  );

  const ChristmasVictoryScreen = () => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      
      useEffect(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          // Snow
          const snowflakes: {x: number, y: number, r: number, v: number}[] = [];
          for(let i=0; i<150; i++) {
              snowflakes.push({
                  x: Math.random() * canvas.width,
                  y: Math.random() * canvas.height,
                  r: Math.random() * 3 + 1,
                  v: Math.random() * 2 + 1
              });
          }

          // Firework Text
          const particles: {x: number, y: number, tx: number, ty: number, color: string, life: number}[] = [];
          const text = "Merry Christmas";
          
          // Generate target points from text
          const offCanvas = document.createElement('canvas');
          offCanvas.width = canvas.width;
          offCanvas.height = canvas.height;
          const offCtx = offCanvas.getContext('2d');
          if(offCtx) {
             // Dynamic huge font size
             const fontSize = Math.min(canvas.width / 6, 180); 
             offCtx.font = `bold ${fontSize}px "Fredoka One", sans-serif`;
             offCtx.textAlign = "center";
             offCtx.textBaseline = "middle";
             offCtx.fillStyle = "white";
             // Position text slightly above center to make room for button
             offCtx.fillText(text, canvas.width/2, canvas.height/2 - 60);
             
             const imageData = offCtx.getImageData(0,0, canvas.width, canvas.height).data;
             const step = 5; // Density
             for(let y=0; y<canvas.height; y+=step) {
                 for(let x=0; x<canvas.width; x+=step) {
                     const alpha = imageData[(y*canvas.width + x)*4 + 3];
                     if(alpha > 128) {
                         particles.push({
                             x: canvas.width / 2, // Start from center
                             y: canvas.height, // Start from bottom
                             tx: x,
                             ty: y,
                             color: `hsl(${Math.random()*360}, 100%, 75%)`,
                             life: 0
                         });
                     }
                 }
             }
          }

          let frame = 0;
          let animationFrameId: number;

          const animate = () => {
              ctx.clearRect(0,0, canvas.width, canvas.height);
              
              // Draw Snow
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              snowflakes.forEach(f => {
                  f.y += f.v;
                  if(f.y > canvas.height) f.y = -5;
                  ctx.beginPath();
                  ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
                  ctx.fill();
              });

              // Draw Particles
              frame++;
              const cycle = 400; // Frames per cycle
              const phase = Math.floor(frame / (cycle/2)) % 2; // 0: Assemble, 1: Explode
              
              particles.forEach(p => {
                  if (phase === 0) {
                      // Move to target with easing
                      p.x += (p.tx - p.x) * 0.08;
                      p.y += (p.ty - p.y) * 0.08;
                  } else {
                      // Explode / Drift
                      const dx = p.x - canvas.width/2;
                      const dy = p.y - canvas.height/2;
                      const dist = Math.sqrt(dx*dx + dy*dy) + 0.1;
                      
                      // Push out + random jiggle + gravity
                      p.x += (Math.random() - 0.5) * 4 + (dx/dist);
                      p.y += (Math.random() - 0.5) * 4 + (dy/dist);
                      p.y += 0.5; // Slight gravity
                  }
                  
                  ctx.fillStyle = p.color;
                  ctx.fillRect(p.x, p.y, 3, 3);
              });
              
              // Reset positions for next assembly
              if (frame % cycle === 0) {
                   particles.forEach(p => {
                      p.x = Math.random() * canvas.width;
                      p.y = canvas.height + Math.random() * 100;
                  });
              }

              animationFrameId = requestAnimationFrame(animate);
          };
          animate();

          return () => cancelAnimationFrame(animationFrameId);
      }, []);

      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-end pb-24 p-4 font-toon text-white z-50 text-center relative overflow-hidden">
             <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
             <button onClick={() => {
                    setUnlockedLevels([1, 2, 3]); // UNLOCK ALL LEVELS
                    setCurrentLevelId(1);
                    setSecretFound(false);
                    setStatus(GameStatus.MENU);
                }} className="z-10 px-12 py-4 text-2xl bg-green-600 text-white border-4 border-white rounded-2xl hover:bg-green-500 shadow-[0_0_20px_green] transition-transform hover:scale-105 active:scale-95 animate-pulse">
                    Back to Menu
                </button>
        </div>
      );
  }

  const VictoryScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-toon-pink to-toon-purple flex flex-col items-center justify-center p-4 font-toon text-white z-50 text-center">
        <Trophy size={100} className="text-toon-yellow mb-6 drop-shadow-lg" />
        <h1 className="text-6xl md:text-8xl mb-4 drop-shadow-[6px_6px_0_#000]">YOU WON!</h1>
        <p className="text-2xl mb-12 font-body max-w-md">You've conquered all the worlds and proven yourself a master jumper!</p>
        <button onClick={() => {
            setUnlockedLevels([1, 2, 3]); // UNLOCK ALL LEVELS
            setCurrentLevelId(1);
            setSecretFound(false);
            setStatus(GameStatus.MENU);
        }} className="px-12 py-4 text-2xl bg-toon-yellow text-black border-4 border-black rounded-2xl hover:bg-yellow-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
            Play Again
        </button>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden">
      {status === GameStatus.MENU && <MenuScreen />}
      {status === GameStatus.EDITOR && (
          <LevelEditor 
             initialMap={customMap}
             onPlay={handleTestCustomLevel}
             onExit={() => setStatus(GameStatus.MENU)}
          />
      )}
      {status === GameStatus.PLAYING && (
        <GameEngine 
            level={getCurrentLevelConfig()} 
            showWingTutorial={currentLevelId === 2 && !tutorialSeen}
            onCloseTutorial={handleTutorialClose}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
            onExit={handleExit}
        />
      )}
      {status === GameStatus.LEVEL_COMPLETE && <LevelCompleteScreen />}
      {status === GameStatus.GAME_OVER && <GameOverScreen />}
      {status === GameStatus.VICTORY && (secretFound ? <ChristmasVictoryScreen /> : <VictoryScreen />)}
    </div>
  );
};

export default App;