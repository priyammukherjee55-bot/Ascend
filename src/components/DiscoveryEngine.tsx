import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  AppUser,
  TeamItem,
  SportType,
  SavedSearchConfig,
  RecentSearchItem,
} from '../types/models';
import {
  calculateDistanceKm,
  SAMPLE_HIERARCHIES,
  encodeGeohash,
} from '../lib/geo';
import { LocationSelector } from './LocationSelector';
import { MultiFilterEngine, FilterState } from './MultiFilterEngine';
import { PlayerCard, TeamCard } from './PlayerCard';
import { PrivacyMapView } from './PrivacyMapView';
import { EmptyState } from './EmptyState';
import {
  MapPin,
  List,
  Map as MapIcon,
  Bookmark,
  History,
  SlidersHorizontal,
  Compass,
  Search,
  CheckCircle,
  X,
  Users,
  Shield,
  Trash2,
} from 'lucide-react';

interface DiscoveryEngineProps {
  selectedSport: SportType;
  onOpenAuth: () => void;
  onSelectSport: (sport: SportType) => void;
}

export const DiscoveryEngine: React.FC<DiscoveryEngineProps> = ({
  selectedSport,
  onOpenAuth,
  onSelectSport,
}) => {
  const { currentUser, userProfile } = useAuth();

  // 1. Dual View System Toggle: List View vs Privacy-Safe Map View
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');

  // 2. Geospatial Center State & Fallback
  const defaultCity = SAMPLE_HIERARCHIES[0].states[0].districts[0].cities[0];
  const [geoCountry, setGeoCountry] = useState<string>('India');
  const [geoState, setGeoState] = useState<string>('Maharashtra');
  const [geoDistrict, setGeoDistrict] = useState<string>('Mumbai Suburban');
  const [geoCity, setGeoCity] = useState<string>('Mumbai');
  const [geoLocality, setGeoLocality] = useState<string>('All');
  const [centerLat, setCenterLat] = useState<number>(defaultCity.lat);
  const [centerLon, setCenterLon] = useState<number>(defaultCity.lon);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 3. Entity Type Selector: Players vs Teams/Clubs
  const [entityType, setEntityType] = useState<'players' | 'teams'>('players');

  // 4. Advanced Filter State
  const [filters, setFilters] = useState<FilterState>({
    sport: selectedSport,
    radiusKm: 25,
    customRadius: 35,
    experienceLevels: [],
    minAge: 14,
    maxAge: 45,
    availability: 'all',
    teamStatus: 'none',
    cricketBattingStyle: 'all',
    cricketBattingPosition: 'all',
    cricketBowlingType: 'all',
    cricketFormat: 'all',
    footballFoot: 'all',
    footballPosition: 'all',
    footballStyle: '',
  });

  // Sync sport changes from parent
  useEffect(() => {
    setFilters((prev) => ({ ...prev, sport: selectedSport }));
  }, [selectedSport]);

  // 5. Data State (Fetched from real Firestore)
  const [rawPlayers, setRawPlayers] = useState<AppUser[]>([]);
  const [rawTeams, setRawTeams] = useState<TeamItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchConfig[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    const saved = localStorage.getItem('ascend_recent_searches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchHistoryOpen, setSearchHistoryOpen] = useState<boolean>(false);

  // 6. Device GPS detection with privacy fuzzing
  const handleDetectDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // We truncate coordinates to safeguard athlete residence privacy
        const approxLat = Math.round(pos.coords.latitude * 1000) / 1000;
        const approxLon = Math.round(pos.coords.longitude * 1000) / 1000;
        setCenterLat(approxLat);
        setCenterLon(approxLon);
        setGpsActive(true);
        setGeoCity('Current Location');
      },
      (err) => {
        setGpsError(err.message || 'Location permission denied.');
        setGpsActive(false);
      },
      { timeout: 8000 }
    );
  };

  // 7. Subscribe to real Firestore Users & Teams
  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        const list: AppUser[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as AppUser);
        });
        setRawPlayers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users for discovery:', err);
        setLoading(false);
      }
    );

    const teamsRef = collection(db, 'teams');
    const unsubscribeTeams = onSnapshot(
      teamsRef,
      (snapshot) => {
        const tList: TeamItem[] = [];
        snapshot.forEach((d) => {
          tList.push({ id: d.id, ...d.data() } as TeamItem);
        });
        setRawTeams(tList);
      },
      (err) => {
        console.error('Error fetching teams for discovery:', err);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTeams();
    };
  }, []);

  // 8. Subscribe to User's Saved Searches in Firestore
  useEffect(() => {
    if (!currentUser) {
      setSavedSearches([]);
      return;
    }
    const searchesRef = collection(db, 'saved_searches');
    const q = query(searchesRef, where('userId', '==', currentUser.uid));
    const unsubscribeSearches = onSnapshot(q, (snapshot) => {
      const sList: SavedSearchConfig[] = [];
      snapshot.forEach((d) => {
        sList.push({ id: d.id, ...d.data() } as SavedSearchConfig);
      });
      setSavedSearches(sList);
    });

    // Subscribe to follows
    const followsRef = collection(db, 'follows');
    const qFollows = query(followsRef, where('followerId', '==', currentUser.uid));
    const unsubscribeFollows = onSnapshot(qFollows, (snapshot) => {
      const map: Record<string, boolean> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[data.targetUserId] = true;
      });
      setFollowingMap(map);
    });

    return () => {
      unsubscribeSearches();
      unsubscribeFollows();
    };
  }, [currentUser]);

  // 9. Save Search configuration to Firestore
  const handleSaveSearchConfig = async (title: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      const effectiveRadius = filters.radiusKm === -1 ? filters.customRadius : filters.radiusKm;
      await addDoc(collection(db, 'saved_searches'), {
        userId: currentUser.uid,
        title,
        sport: filters.sport,
        radiusKm: effectiveRadius,
        locationName: geoCity,
        lat: centerLat,
        lon: centerLon,
        filters: { ...filters },
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error('Error saving search preset:', err);
    }
  };

  // Delete saved search configuration
  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      await deleteDoc(doc(db, 'saved_searches', searchId));
    } catch (err) {
      console.error('Delete search error:', err);
    }
  };

  // Apply saved search preset
  const handleApplySavedSearch = (saved: SavedSearchConfig) => {
    if (saved.lat && saved.lon) {
      setCenterLat(saved.lat);
      setCenterLon(saved.lon);
    }
    setGeoCity(saved.locationName);
    onSelectSport(saved.sport);
    setFilters({
      ...filters,
      ...saved.filters,
      sport: saved.sport,
      radiusKm: saved.radiusKm,
    });
    setSearchHistoryOpen(false);
  };

  // Toggle Follow
  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      const followDocId = `${currentUser.uid}_${targetUserId}`;
      const isAlready = followingMap[targetUserId];
      if (isAlready) {
        await deleteDoc(doc(db, 'follows', followDocId));
      } else {
        await addDoc(collection(db, 'follows'), {
          id: followDocId,
          followerId: currentUser.uid,
          targetUserId,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  // Record recent search
  const logRecentSearch = (cityLabel: string, radius: number) => {
    const item: RecentSearchItem = {
      id: 'search-' + Date.now(),
      queryText: `${selectedSport.toUpperCase()} in ${cityLabel} within ${radius}km`,
      sport: selectedSport,
      radiusKm: radius,
      cityName: cityLabel,
      timestamp: Date.now(),
    };
    const updated = [item, ...recentSearches.filter((s) => s.cityName !== cityLabel).slice(0, 5)];
    setRecentSearches(updated);
    localStorage.setItem('ascend_recent_searches', JSON.stringify(updated));
  };

  // 10. Filter calculation logic
  const effectiveRadius = filters.radiusKm === -1 ? filters.customRadius : filters.radiusKm;

  // Filter players
  const filteredPlayers = rawPlayers.filter((player) => {
    // 1. Role filter: only display players/athletes
    if (player.role !== 'player' && player.role !== 'organizer') return false;

    // 2. Sport filter
    if (player.activeSports && !player.activeSports.includes(filters.sport)) {
      if (filters.sport === 'cricket' && !player.cricketProfile) return false;
      if (filters.sport === 'football' && !player.footballProfile) return false;
    }

    // 3. Proximity distance check
    const pLat = player.location?.latitude ?? centerLat;
    const pLon = player.location?.longitude ?? centerLon;
    const dist = calculateDistanceKm(centerLat, centerLon, pLat, pLon);
    if (dist > effectiveRadius) return false;

    // 4. Locality match check if selected
    if (
      geoLocality !== 'All' &&
      player.location?.locality &&
      player.location.locality.toLowerCase() !== geoLocality.toLowerCase()
    ) {
      return false;
    }

    // 5. Experience level filter
    if (
      filters.experienceLevels.length > 0 &&
      !filters.experienceLevels.includes(player.experienceLevel)
    ) {
      return false;
    }

    // 6. Age filter
    if (player.age && (player.age < filters.minAge || player.age > filters.maxAge)) {
      return false;
    }

    // 7. Availability filter
    if (filters.availability !== 'all' && player.availability && player.availability !== filters.availability) {
      return false;
    }

    // 8. Team status seeking
    if (filters.teamStatus !== 'none' && player.teamStatus && player.teamStatus !== filters.teamStatus) {
      return false;
    }

    // 9. Sport specific: Cricket
    if (filters.sport === 'cricket' && player.cricketProfile) {
      if (
        filters.cricketBattingStyle !== 'all' &&
        player.cricketProfile.battingStyle !== filters.cricketBattingStyle
      ) {
        return false;
      }
      if (
        filters.cricketBattingPosition !== 'all' &&
        player.cricketProfile.battingPosition !== filters.cricketBattingPosition
      ) {
        return false;
      }
      if (filters.cricketBowlingType !== 'all') {
        const bStyle = player.cricketProfile.bowlingStyle || '';
        if (filters.cricketBowlingType === 'Fast' && !bStyle.includes('Fast')) return false;
        if (filters.cricketBowlingType === 'Medium' && !bStyle.includes('Medium')) return false;
        if (filters.cricketBowlingType === 'Spin' && !bStyle.includes('Spin') && !bStyle.includes('Orthodox')) return false;
      }
      if (
        filters.cricketFormat !== 'all' &&
        player.cricketProfile.preferredFormats &&
        !player.cricketProfile.preferredFormats.includes(filters.cricketFormat!)
      ) {
        return false;
      }
    }

    // 10. Sport specific: Football
    if (filters.sport === 'football' && player.footballProfile) {
      if (
        filters.footballFoot !== 'all' &&
        player.footballProfile.preferredFoot !== filters.footballFoot
      ) {
        return false;
      }
      if (
        filters.footballPosition !== 'all' &&
        player.footballProfile.primaryPosition !== filters.footballPosition
      ) {
        return false;
      }
      if (filters.footballStyle && filters.footballStyle.trim().length > 0) {
        const queryTrait = filters.footballStyle.toLowerCase();
        const hasTrait = player.footballProfile.characteristics?.some((c) =>
          c.toLowerCase().includes(queryTrait)
        );
        if (!hasTrait) return false;
      }
    }

    return true;
  });

  // Filter teams
  const filteredTeams = rawTeams.filter((team) => {
    if (team.sport !== filters.sport) return false;
    const tLat = team.latitude ?? centerLat;
    const tLon = team.longitude ?? centerLon;
    const dist = calculateDistanceKm(centerLat, centerLon, tLat, tLon);
    return dist <= effectiveRadius;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Title, Entity Selector, Dual View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-500" />
            <span>Geospatial Discovery & Nearby Engine</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Privacy-preserving athlete and team scout within{' '}
            <strong className="text-emerald-500">{effectiveRadius} km</strong> of {geoCity}
          </p>
        </div>

        {/* View Switchers (List vs Map) and Entity Tabs */}
        <div className="flex items-center gap-3">
          {/* Entity Type Toggle: Players vs Squads */}
          <div className="p-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setEntityType('players')}
              className={`px-3 py-1.5 rounded-lg transition ${
                entityType === 'players'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Athletes ({filteredPlayers.length})
            </button>
            <button
              onClick={() => setEntityType('teams')}
              className={`px-3 py-1.5 rounded-lg transition ${
                entityType === 'teams'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Clubs ({filteredTeams.length})
            </button>
          </div>

          {/* Dual View Toggle: List View vs Interactive Map View */}
          <div className="p-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeView === 'list'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="Interactive List View"
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeView === 'map'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="Privacy-Safe Map View"
            >
              <MapIcon className="w-4 h-4" />
              <span>Map Radar</span>
            </button>
          </div>

          {/* Saved / Recent Presets Drawer Button */}
          <button
            onClick={() => setSearchHistoryOpen(!searchHistoryOpen)}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Saved Searches & History"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Saved Searches & History Drawer Bar */}
      {searchHistoryOpen && (
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-500" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
                Saved Search Configurations (Firestore)
              </h4>
            </div>
            <button
              onClick={() => setSearchHistoryOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {savedSearches.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No search presets saved yet. Configure your filters and click "Save Search" to bookmark.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold shadow-sm"
                >
                  <span
                    onClick={() => handleApplySavedSearch(s)}
                    className="cursor-pointer hover:text-emerald-500 flex items-center gap-1"
                  >
                    <span>{s.sport === 'cricket' ? '🏏' : '⚽'}</span>
                    <span>{s.title}</span>
                    <span className="text-zinc-400 font-normal">({s.radiusKm}km)</span>
                  </span>
                  <button
                    onClick={() => handleDeleteSavedSearch(s.id)}
                    className="text-zinc-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1 mb-2">
                <History className="w-3 h-3" /> Recent Search History
              </span>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    {r.queryText}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Hierarchical Location Selector: Country -> State -> District -> City -> Locality */}
      <LocationSelector
        country={geoCountry}
        state={geoState}
        district={geoDistrict}
        city={geoCity}
        locality={geoLocality}
        gpsActive={gpsActive}
        gpsError={gpsError}
        onChange={({ country, state, district, city, locality, lat, lon }) => {
          setGeoCountry(country);
          setGeoState(state);
          setGeoDistrict(district);
          setGeoCity(city);
          setGeoLocality(locality);
          if (lat && lon) {
            setCenterLat(lat);
            setCenterLon(lon);
          }
          setGpsActive(false);
          logRecentSearch(city, effectiveRadius);
        }}
        onDetectDeviceLocation={handleDetectDeviceLocation}
      />

      {/* 3. Advanced Multi-Filter Engine */}
      <MultiFilterEngine
        filters={filters}
        onChange={(up) => {
          setFilters(up);
          logRecentSearch(geoCity, up.radiusKm === -1 ? up.customRadius : up.radiusKm);
        }}
        onReset={() =>
          setFilters({
            sport: selectedSport,
            radiusKm: 25,
            customRadius: 35,
            experienceLevels: [],
            minAge: 14,
            maxAge: 45,
            availability: 'all',
            teamStatus: 'none',
            cricketBattingStyle: 'all',
            cricketBattingPosition: 'all',
            cricketBowlingType: 'all',
            cricketFormat: 'all',
            footballFoot: 'all',
            footballPosition: 'all',
            footballStyle: '',
          })
        }
        onSaveSearch={handleSaveSearchConfig}
        canSave={!!currentUser}
      />

      {/* 4. Dynamic Views: List View vs Privacy-Safe Map View */}
      {activeView === 'map' ? (
        <PrivacyMapView
          centerLat={centerLat}
          centerLon={centerLon}
          radiusKm={effectiveRadius}
          centerCity={geoCity}
          players={filteredPlayers}
          teams={filteredTeams}
          selectedSport={filters.sport}
          onSelectPlayer={(p) => {
            alert(`Selected athlete: ${p.name} from ${p.location?.city}`);
          }}
        />
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
            <span>
              Showing {entityType === 'players' ? filteredPlayers.length : filteredTeams.length}{' '}
              registered results
            </span>
            <span>Radius: {effectiveRadius} km from {geoCity}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
              Running spatial geospatial query across Firestore records...
            </div>
          ) : entityType === 'players' ? (
            filteredPlayers.length === 0 ? (
              <EmptyState
                icon={<Compass className="w-6 h-6 text-zinc-400" />}
                title={`No ${filters.sport} athletes found within ${effectiveRadius} km of ${geoCity}`}
                description="Try expanding your distance radius slider, changing your technical criteria (handedness/position), or switching city center."
                actionText="Register Your Player Profile"
                onAction={onOpenAuth}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => {
                  const pLat = player.location?.latitude ?? centerLat;
                  const pLon = player.location?.longitude ?? centerLon;
                  const dist = calculateDistanceKm(centerLat, centerLon, pLat, pLon);
                  return (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      distanceKm={dist}
                      selectedSport={filters.sport}
                      isFollowing={!!followingMap[player.id]}
                      onToggleFollow={handleToggleFollow}
                      onViewProfile={(p) => {
                        alert(`Opening verified player dossier for ${p.name}`);
                      }}
                    />
                  );
                })}
              </div>
            )
          ) : filteredTeams.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6 text-zinc-400" />}
              title={`No registered ${filters.sport} clubs found within ${effectiveRadius} km of ${geoCity}`}
              description="Clubs and squads registered in Firestore within this geospatial boundary will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTeams.map((team) => {
                const tLat = team.latitude ?? centerLat;
                const tLon = team.longitude ?? centerLon;
                const dist = calculateDistanceKm(centerLat, centerLon, tLat, tLon);
                return <TeamCard key={team.id} team={team} distanceKm={dist} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
