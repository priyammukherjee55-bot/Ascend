import React, { useState } from 'react';
import {
  SportType,
  ExperienceLevel,
  AvailabilityType,
  TeamSeekingStatus,
  CricketBattingStyle,
  CricketBattingPosition,
  CricketBowlingStyle,
  CricketFormat,
  FootballFoot,
  FootballPosition,
} from '../types/models';
import { Filter, SlidersHorizontal, RotateCcw, Save, Check, Bookmark } from 'lucide-react';

export interface FilterState {
  sport: SportType;
  radiusKm: number;
  customRadius: number;
  experienceLevels: ExperienceLevel[];
  minAge: number;
  maxAge: number;
  availability: AvailabilityType;
  teamStatus: TeamSeekingStatus;

  // Cricket specific
  cricketBattingStyle?: CricketBattingStyle | 'all';
  cricketBattingPosition?: CricketBattingPosition | 'all';
  cricketBowlingType?: 'all' | 'Fast' | 'Medium' | 'Spin';
  cricketFormat?: CricketFormat | 'all';

  // Football specific
  footballFoot?: FootballFoot | 'all';
  footballPosition?: FootballPosition | 'all';
  footballStyle?: string;
}

interface MultiFilterEngineProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
  onReset: () => void;
  onSaveSearch: (title: string) => void;
  canSave: boolean;
}

export const MultiFilterEngine: React.FC<MultiFilterEngineProps> = ({
  filters,
  onChange,
  onReset,
  onSaveSearch,
  canSave,
}) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const radiusOptions = [1, 2, 5, 10, 25, 50, -1]; // -1 for custom

  const handleRadiusClick = (r: number) => {
    onChange({ ...filters, radiusKm: r });
  };

  const toggleExperience = (exp: ExperienceLevel) => {
    const exists = filters.experienceLevels.includes(exp);
    const updated = exists
      ? filters.experienceLevels.filter((e) => e !== exp)
      : [...filters.experienceLevels, exp];
    onChange({ ...filters, experienceLevels: updated });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    onSaveSearch(saveTitle.trim());
    setSaveTitle('');
    setSaveModalOpen(false);
  };

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
      {/* Filter Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-sm uppercase tracking-wide text-zinc-900 dark:text-white">
            Geospatial & Technical Filter Engine
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {canSave && (
            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Search</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 ml-1"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 text-xs">
          {/* 1. RADIUS FILTERS: 1 km, 2 km, 5 km, 10 km, 25 km, 50 km, and Custom */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Proximity Radius Filter
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {radiusOptions.map((r) => {
                const isCustom = r === -1;
                const isSelected = filters.radiusKm === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusClick(r)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      isSelected
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isCustom ? 'Custom Radius' : `${r} km`}
                  </button>
                );
              })}

              {filters.radiusKm === -1 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={filters.customRadius}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        customRadius: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-20 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold"
                  />
                  <span className="text-zinc-500 font-bold">km</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. UNIVERSAL FILTERS: Experience, Availability, Team Seeking, Age Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* Experience Level Checkboxes */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Experience Tier
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['beginner', 'intermediate', 'advanced', 'semi-pro', 'pro'] as ExperienceLevel[]).map(
                  (lvl) => {
                    const active = filters.experienceLevels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleExperience(lvl)}
                        className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                          active
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Schedule Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) => onChange({ ...filters, availability: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <option value="all">Any Availability</option>
                <option value="available_now">🟢 Available Now</option>
                <option value="weekends">📅 Weekends Only</option>
                <option value="evenings">🌙 Evenings</option>
              </select>
            </div>

            {/* Team Status Seeking */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Recruitment & Status
              </label>
              <select
                value={filters.teamStatus}
                onChange={(e) => onChange({ ...filters, teamStatus: e.target.value as any })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <option value="none">All Athletes</option>
                <option value="looking_for_team">🔥 Looking for Team (Free Agent)</option>
                <option value="looking_for_players">👥 Looking for Players (Team Captains)</option>
              </select>
            </div>
          </div>

          {/* Age Range Slider Controls */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Age Range Bracket: {filters.minAge} - {filters.maxAge} years
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="range"
                min={14}
                max={50}
                value={filters.minAge}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    minAge: Math.min(parseInt(e.target.value), filters.maxAge - 1),
                  })
                }
                className="w-full accent-emerald-500"
              />
              <input
                type="range"
                min={14}
                max={50}
                value={filters.maxAge}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    maxAge: Math.max(parseInt(e.target.value), filters.minAge + 1),
                  })
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* 3. SPORT-SPECIFIC TECHNICAL FILTERS */}
          {filters.sport === 'cricket' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-500 font-extrabold uppercase text-[11px]">
                <span>🏏</span> Cricket Technical Profile Filters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Handedness */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Handedness
                  </label>
                  <select
                    value={filters.cricketBattingStyle || 'all'}
                    onChange={(e) =>
                      onChange({ ...filters, cricketBattingStyle: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">All Batting Hands</option>
                    <option value="RHB">Right-Hand Bat (RHB)</option>
                    <option value="LHB">Left-Hand Bat (LHB)</option>
                  </select>
                </div>

                {/* Batting Position */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Batting Position
                  </label>
                  <select
                    value={filters.cricketBattingPosition || 'all'}
                    onChange={(e) =>
                      onChange({ ...filters, cricketBattingPosition: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">All Positions</option>
                    <option value="Opener">Opener</option>
                    <option value="Top Order">Top Order (3-4)</option>
                    <option value="Middle Order">Middle Order (5-7)</option>
                    <option value="Lower Order">Lower Order (8-11)</option>
                  </select>
                </div>

                {/* Bowling Type */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Bowling Type
                  </label>
                  <select
                    value={filters.cricketBowlingType || 'all'}
                    onChange={(e) =>
                      onChange({ ...filters, cricketBowlingType: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">All Bowling Types</option>
                    <option value="Fast">Fast / Express Pace</option>
                    <option value="Medium">Medium Pace / Swing</option>
                    <option value="Spin">Spin (Off / Leg / Orthodox)</option>
                  </select>
                </div>

                {/* Preferred Format */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Format
                  </label>
                  <select
                    value={filters.cricketFormat || 'all'}
                    onChange={(e) => onChange({ ...filters, cricketFormat: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">All Formats</option>
                    <option value="T20">T20</option>
                    <option value="ODI">One-Day (ODI)</option>
                    <option value="Test">Multi-day / Test</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {filters.sport === 'football' && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold uppercase text-[11px]">
                <span>⚽</span> Football Technical Profile Filters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Preferred Foot */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Preferred Foot
                  </label>
                  <select
                    value={filters.footballFoot || 'all'}
                    onChange={(e) => onChange({ ...filters, footballFoot: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">Any Foot</option>
                    <option value="Right">Right Foot</option>
                    <option value="Left">Left Foot</option>
                    <option value="Both">Both Feet (Ambidextrous)</option>
                  </select>
                </div>

                {/* Specific Position */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Pitch Position
                  </label>
                  <select
                    value={filters.footballPosition || 'all'}
                    onChange={(e) =>
                      onChange({ ...filters, footballPosition: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    <option value="all">All Positions</option>
                    <option value="GK">Goalkeeper (GK)</option>
                    <option value="CB">Center Back (CB)</option>
                    <option value="LB">Left Back (LB)</option>
                    <option value="RB">Right Back (RB)</option>
                    <option value="CDM">Defensive Mid (CDM)</option>
                    <option value="CM">Central Mid (CM)</option>
                    <option value="CAM">Attacking Mid (CAM)</option>
                    <option value="LW">Left Winger (LW)</option>
                    <option value="RW">Right Winger (RW)</option>
                    <option value="ST">Striker (ST)</option>
                  </select>
                </div>

                {/* Playing Style */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    Playing Style Trait
                  </label>
                  <input
                    type="text"
                    value={filters.footballStyle || ''}
                    onChange={(e) => onChange({ ...filters, footballStyle: e.target.value })}
                    placeholder="e.g. Pace, Playmaker, Physical"
                    className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Search Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-100 shadow-2xl">
            <h4 className="font-extrabold text-sm uppercase mb-1">Save Search Configuration</h4>
            <p className="text-xs text-zinc-400 mb-3">
              Store this combination of sport, radius, and technical filters to your profile for 1-tap re-scouting.
            </p>
            <form onSubmit={handleSaveSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Fast Bowlers <10km / Left Wingers"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg transition"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
