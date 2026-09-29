import React, { useState } from 'react';
import { AppUser, TeamItem, SportType } from '../types/models';
import { calculateDistanceKm } from '../lib/geo';
import { MapPin, Shield, User, Navigation, Eye, Compass, Info } from 'lucide-react';

interface PrivacyMapViewProps {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  centerCity: string;
  players: AppUser[];
  teams: TeamItem[];
  selectedSport: SportType;
  onSelectPlayer: (player: AppUser) => void;
}

export const PrivacyMapView: React.FC<PrivacyMapViewProps> = ({
  centerLat,
  centerLon,
  radiusKm,
  centerCity,
  players,
  teams,
  selectedSport,
  onSelectPlayer,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<AppUser | null>(null);

  // Calculate relative pixel positions in a simulated radar/grid bounding box
  // 1 degree latitude ~= 111 km.
  const kmPerDegree = 111;
  const degreeSpan = (radiusKm * 2.2) / kmPerDegree;

  return (
    <div className="space-y-4">
      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Privacy-Safe Spatial Map:</strong> Exact home addresses & GPS coordinates are fuzzed into neighborhood clusters (~800m grid cell) to safeguard athlete privacy.
          </span>
        </div>
        <span className="font-mono text-emerald-400 font-bold hidden sm:inline">
          R = {radiusKm} km
        </span>
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative w-full h-[520px] rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl select-none">
        {/* Spatial Grid Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #3f3f46 1px, transparent 1px), linear-gradient(to bottom, #3f3f46 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Concentric Distance Rings */}
        <div className="absolute w-[20%] h-[20%] rounded-full border border-emerald-500/20 pointer-events-none" />
        <div className="absolute w-[45%] h-[45%] rounded-full border border-emerald-500/25 pointer-events-none" />
        <div className="absolute w-[75%] h-[75%] rounded-full border border-emerald-500/30 border-dashed pointer-events-none" />
        <div className="absolute w-[95%] h-[95%] rounded-full border border-emerald-500/15 pointer-events-none" />

        {/* Center Point: Selected Search Anchor */}
        <div className="absolute z-20 flex flex-col items-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="mt-1.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-zinc-700 text-[10px] font-bold text-white tracking-wide">
            {centerCity || 'Search Anchor'}
          </span>
        </div>

        {/* Render Players on Spatial Radar Canvas */}
        {players.map((player) => {
          const pLat = player.location?.latitude ?? centerLat;
          const pLon = player.location?.longitude ?? centerLon;

          // Normalized offset (-1 to 1)
          const dLat = (pLat - centerLat) / (degreeSpan / 2 || 1);
          const dLon = (pLon - centerLon) / (degreeSpan / 2 || 1);

          // Clamped percentage
          const leftPercent = Math.max(8, Math.min(92, 50 + dLon * 42));
          const topPercent = Math.max(8, Math.min(92, 50 - dLat * 42));

          const dist = calculateDistanceKm(centerLat, centerLon, pLat, pLon);
          const isSelected = selectedEntity?.id === player.id;

          return (
            <div
              key={player.id}
              onClick={() => setSelectedEntity(player)}
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group transition-all"
            >
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 group-hover:scale-125 ${
                  isSelected
                    ? 'w-10 h-10 rounded-2xl bg-emerald-400 text-black ring-4 ring-emerald-400/30'
                    : 'w-8 h-8 rounded-xl bg-zinc-900 border border-emerald-500 text-emerald-400 shadow-md'
                }`}
              >
                <span className="text-xs font-black">
                  {selectedSport === 'cricket' ? '🏏' : '⚽'}
                </span>
                {player.isVerified && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-zinc-900" />
                )}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-[10px] font-bold shadow-xl">
                  <p>{player.name}</p>
                  <p className="text-[9px] text-zinc-400 font-mono">~{dist} km away</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Coordinates: {centerLat.toFixed(3)}, {centerLon.toFixed(3)}</span>
          <span className="text-zinc-500">•</span>
          <span>{players.length} Athletes Plotted</span>
        </div>

        {/* Selected Entity Preview Box */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 z-40 w-72 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl text-zinc-100 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm leading-tight">{selectedEntity.name}</h4>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {selectedEntity.location?.locality || selectedEntity.location?.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 py-2 border-y border-zinc-800 text-xs space-y-1">
              {selectedSport === 'cricket' && selectedEntity.cricketProfile && (
                <>
                  <p className="text-zinc-300">
                    <strong>Bat:</strong> {selectedEntity.cricketProfile.battingStyle}
                  </p>
                  <p className="text-zinc-300">
                    <strong>Bowl:</strong> {selectedEntity.cricketProfile.bowlingStyle}
                  </p>
                </>
              )}
              {selectedSport === 'football' && selectedEntity.footballProfile && (
                <>
                  <p className="text-zinc-300">
                    <strong>Position:</strong> {selectedEntity.footballProfile.primaryPosition}
                  </p>
                  <p className="text-zinc-300">
                    <strong>Foot:</strong> {selectedEntity.footballProfile.preferredFoot}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => onSelectPlayer(selectedEntity)}
              className="mt-3 w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl transition"
            >
              Inspect Complete Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
