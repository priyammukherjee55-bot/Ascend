import React, { useState } from 'react';
import { SportType } from '../../types/models';
import { Cricket3DBackground, CricketDuel } from './Cricket3DBackground';
import { Football3DBackground, FootballPlay } from './Football3DBackground';
import { useTheme } from '../../context/ThemeContext';
import {
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';

interface Sports3DCanvasProps {
  currentSport: SportType;
  mode?: 'ambient' | 'full';
  opacity?: number;
  onToggleFullscreen?: () => void;
  className?: string;
}

export const Sports3DCanvas: React.FC<Sports3DCanvasProps> = ({
  currentSport,
  mode = 'ambient',
  opacity = 0.85,
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeSport, setActiveSport] = useState<SportType>(currentSport);
  const [cricketDuel, setCricketDuel] = useState<CricketDuel>('kohli_bumrah');
  const [footballPlay, setFootballPlay] = useState<FootballPlay>('messi_curl');
  const [isExpanded, setIsExpanded] = useState<boolean>(mode === 'full');
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Sync when prop changes
  React.useEffect(() => {
    setActiveSport(currentSport);
  }, [currentSport]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 text-white border border-zinc-700 shadow-xl text-xs font-bold hover:scale-105 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Show 3D Arena</span>
        </button>
      </div>
    );
  }

  // If in ambient mode and not expanded, render fixed behind or in hero
  if (!isExpanded) {
    return (
      <div className={`relative w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl ${className}`}>
        {/* Top Control Bar */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          {/* Sport Switcher */}
          <button
            onClick={() => setActiveSport(activeSport === 'cricket' ? 'football' : 'cricket')}
            className="px-2 py-1 rounded-lg text-[11px] font-black uppercase text-white hover:bg-white/20 transition flex items-center gap-1"
            title="Toggle between Cricket and Football 3D Arena"
          >
            <span>{activeSport === 'cricket' ? '🏏 3D' : '⚽ 3D'}</span>
          </button>

          {/* Day / Night Theme */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg text-white hover:bg-white/20 transition"
            title={theme === 'dark' ? 'Daylight Arena' : 'Floodlight Night Arena'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
          </button>

          {/* Expand to Full Arena Experience */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 rounded-lg text-white hover:bg-white/20 transition"
            title="Expand to Full 3D Stadium Experience"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Hide/Minimize */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition"
            title="Hide 3D View"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Scene View */}
        <div className="w-full h-80 sm:h-96 relative">
          {activeSport === 'cricket' ? (
            <Cricket3DBackground
              interactive={true}
              opacity={opacity}
              selectedDuel={cricketDuel}
              onDuelChange={setCricketDuel}
            />
          ) : (
            <Football3DBackground
              interactive={true}
              opacity={opacity}
              selectedPlay={footballPlay}
              onPlayChange={setFootballPlay}
            />
          )}
        </div>
      </div>
    );
  }

  // Expanded Fullscreen 3D Arena Modal / View
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fadeIn">
      {/* Top Floating Stadium HUD */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-700 shadow-2xl text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeSport === 'cricket' ? '🏏' : '⚽'}</span>
            <span className="font-black text-sm uppercase tracking-wider">
              {activeSport === 'cricket' ? '3D Cricket Stadium' : '3D Football Stadium'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

          {/* Switch Sport */}
          <button
            onClick={() => setActiveSport(activeSport === 'cricket' ? 'football' : 'cricket')}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
          >
            Switch to {activeSport === 'cricket' ? '⚽ Football' : '🏏 Cricket'}
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-700 shadow-2xl">
          {/* Day / Night Theme */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 transition"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Daylight</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>Floodlights</span>
              </>
            )}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition"
            title="Minimize Arena"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div className="w-full h-full flex-1">
        {activeSport === 'cricket' ? (
          <Cricket3DBackground
            interactive={true}
            opacity={1.0}
            selectedDuel={cricketDuel}
            onDuelChange={setCricketDuel}
          />
        ) : (
          <Football3DBackground
            interactive={true}
            opacity={1.0}
            selectedPlay={footballPlay}
            onPlayChange={setFootballPlay}
          />
        )}
      </div>
    </div>
  );
};
