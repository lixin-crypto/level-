import React, { useState, useRef, useEffect } from 'react';
import { TileType } from '../types';
import { Save, Play, X as XIcon, Eraser, Flag, ChevronLeft, ChevronRight, Skull } from 'lucide-react';
import { TILE_SIZE } from '../constants';

interface LevelEditorProps {
  initialMap: string[];
  onPlay: (map: string[]) => void;
  onExit: () => void;
}

const TOOLS = [
  { type: TileType.WALL, icon: '🧱', label: 'Wall' },
  { type: TileType.PLATFORM, icon: '➖', label: 'Platform' },
  { type: TileType.SPIKE, icon: '🔺', label: 'Spike' },
  { type: TileType.MONSTER, icon: '👾', label: 'Monster' },
  { type: TileType.START, icon: '🏁', label: 'Start' },
  { type: TileType.END, icon: '🚩', label: 'End' },
  { type: TileType.EMPTY, icon: '⬜', label: 'Eraser' },
];

export const LevelEditor: React.FC<LevelEditorProps> = ({ initialMap, onPlay, onExit }) => {
  const [mapData, setMapData] = useState<string[][]>([]);
  const [selectedTool, setSelectedTool] = useState<TileType>(TileType.WALL);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse initial map string array to 2D char array
    const parsed = initialMap.map(row => row.split(''));
    setMapData(parsed);
  }, [initialMap]);

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    const newData = [...mapData];
    const row = [...newData[rowIndex]];
    
    // Unique constraints for Start and End
    if (selectedTool === TileType.START) {
        // Remove other starts
        for(let r=0; r<newData.length; r++) {
            for(let c=0; c<newData[r].length; c++) {
                if(newData[r][c] === TileType.START) newData[r][c] = TileType.EMPTY;
            }
        }
    }
    if (selectedTool === TileType.END) {
        // Remove other ends
        for(let r=0; r<newData.length; r++) {
            for(let c=0; c<newData[r].length; c++) {
                if(newData[r][c] === TileType.END) newData[r][c] = TileType.EMPTY;
            }
        }
    }

    row[colIndex] = selectedTool;
    newData[rowIndex] = row;
    setMapData(newData);
  };

  const handlePlay = () => {
    const stringMap = mapData.map(row => row.join(''));
    onPlay(stringMap);
  };

  const getTileColor = (char: string) => {
    switch (char) {
      case TileType.WALL: return 'bg-gray-700 border-gray-500';
      case TileType.PLATFORM: return 'bg-yellow-600 h-1/2 mt-2';
      case TileType.SPIKE: return 'text-red-500 flex items-end justify-center';
      case TileType.MONSTER: return 'bg-purple-600 rounded-t-xl';
      case TileType.START: return 'bg-green-500/50 text-white flex items-center justify-center';
      case TileType.END: return 'bg-red-500/50 text-white flex items-center justify-center';
      default: return 'bg-gray-800/50 border-gray-800'; // Empty grid look
    }
  };

  const renderTileContent = (char: string) => {
      if (char === TileType.SPIKE) return '▲';
      if (char === TileType.START) return 'S';
      if (char === TileType.END) return 'E';
      if (char === TileType.MONSTER) return 'M';
      if (char === TileType.PLATFORM) return '';
      return '';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-toon overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-2 flex items-center justify-between border-b-4 border-black z-10 shadow-lg">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="bg-red-500 p-2 rounded-lg border-2 border-black hover:bg-red-400">
                <XIcon size={24} />
            </button>
            <h2 className="text-xl text-toon-yellow drop-shadow-md">Level Editor</h2>
        </div>
        <div className="flex gap-2 bg-black/30 p-1 rounded-xl">
            {TOOLS.map(tool => (
                <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type)}
                    className={`
                        flex flex-col items-center justify-center p-2 w-16 rounded-lg transition-all border-2
                        ${selectedTool === tool.type 
                            ? 'bg-toon-blue border-white -translate-y-1 shadow-[0_4px_0_rgba(0,0,0,0.5)]' 
                            : 'bg-gray-700 border-black hover:bg-gray-600'}
                    `}
                >
                    <span className="text-2xl">{tool.icon}</span>
                    <span className="text-[10px] uppercase font-bold mt-1">{tool.label}</span>
                </button>
            ))}
        </div>
        <button onClick={handlePlay} className="bg-green-500 px-6 py-2 rounded-lg border-2 border-black hover:bg-green-400 flex items-center gap-2 font-bold shadow-[4px_4px_0_black] active:translate-y-1 active:shadow-none transition-all">
            <Play size={20} fill="currentColor" /> TEST
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-gray-900 relative cursor-crosshair"
           ref={scrollRef}
           onMouseDown={() => setIsDragging(true)}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
      >
        <div className="p-10 min-w-max min-h-max">
            {mapData.map((row, r) => (
                <div key={r} className="flex">
                    {row.map((char, c) => (
                        <div
                            key={`${r}-${c}`}
                            onMouseDown={() => handleTileClick(r, c)}
                            onMouseEnter={() => isDragging && handleTileClick(r, c)}
                            className={`w-10 h-10 border border-white/10 flex-shrink-0 relative box-border hover:bg-white/10`}
                        >
                           {/* Render actual game look approximation */}
                           {char !== TileType.EMPTY && (
                               <div className={`w-full h-full ${getTileColor(char)} absolute inset-0`}>
                                   {renderTileContent(char)}
                               </div>
                           )}
                           {/* Grid Helper Text */}
                           <span className="absolute bottom-0 right-0 text-[8px] text-gray-600 select-none pointer-events-none">{r},{c}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </div>
      
      <div className="bg-gray-800 p-2 text-center text-xs text-gray-400">
          Tip: Click and drag to paint. Make sure to place a Start (S) and End (E).
      </div>
    </div>
  );
};