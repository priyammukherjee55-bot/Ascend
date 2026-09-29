import React from 'react';
import { SAMPLE_HIERARCHIES, LocationHierarchyItem } from '../lib/geo';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface LocationSelectorProps {
  country: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  onChange: (fields: {
    country: string;
    state: string;
    district: string;
    city: string;
    locality: string;
    lat?: number;
    lon?: number;
  }) => void;
  onDetectDeviceLocation: () => void;
  gpsActive: boolean;
  gpsError: string | null;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  state,
  district,
  city,
  locality,
  onChange,
  onDetectDeviceLocation,
  gpsActive,
  gpsError,
}) => {
  // Find current active selections in hierarchy
  const activeCountryObj = SAMPLE_HIERARCHIES.find((c) => c.country === country) || SAMPLE_HIERARCHIES[0];
  const activeStateObj = activeCountryObj.states.find((s) => s.name === state) || activeCountryObj.states[0];
  const activeDistrictObj = activeStateObj.districts.find((d) => d.name === district) || activeStateObj.districts[0];
  const activeCityObj = activeDistrictObj.cities.find((c) => c.name === city) || activeDistrictObj.cities[0];

  const handleCountryChange = (newCountryName: string) => {
    const cObj = SAMPLE_HIERARCHIES.find((c) => c.country === newCountryName) || SAMPLE_HIERARCHIES[0];
    const sObj = cObj.states[0];
    const dObj = sObj.districts[0];
    const ctObj = dObj.cities[0];
    onChange({
      country: cObj.country,
      state: sObj.name,
      district: dObj.name,
      city: ctObj.name,
      locality: ctObj.localities[0] || '',
      lat: ctObj.lat,
      lon: ctObj.lon,
    });
  };

  const handleStateChange = (newStateName: string) => {
    const sObj = activeCountryObj.states.find((s) => s.name === newStateName) || activeCountryObj.states[0];
    const dObj = sObj.districts[0];
    const ctObj = dObj.cities[0];
    onChange({
      country,
      state: sObj.name,
      district: dObj.name,
      city: ctObj.name,
      locality: ctObj.localities[0] || '',
      lat: ctObj.lat,
      lon: ctObj.lon,
    });
  };

  const handleDistrictChange = (newDistrictName: string) => {
    const dObj = activeStateObj.districts.find((d) => d.name === newDistrictName) || activeStateObj.districts[0];
    const ctObj = dObj.cities[0];
    onChange({
      country,
      state,
      district: dObj.name,
      city: ctObj.name,
      locality: ctObj.localities[0] || '',
      lat: ctObj.lat,
      lon: ctObj.lon,
    });
  };

  const handleCityChange = (newCityName: string) => {
    const ctObj = activeDistrictObj.cities.find((c) => c.name === newCityName) || activeDistrictObj.cities[0];
    onChange({
      country,
      state,
      district,
      city: ctObj.name,
      locality: ctObj.localities[0] || '',
      lat: ctObj.lat,
      lon: ctObj.lon,
    });
  };

  const handleLocalityChange = (newLocality: string) => {
    onChange({
      country,
      state,
      district,
      city,
      locality: newLocality,
      lat: activeCityObj.lat,
      lon: activeCityObj.lon,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
            Geographic Fallback & Center Selector
          </span>
        </div>

        <button
          type="button"
          onClick={onDetectDeviceLocation}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
            gpsActive
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
          }`}
          title="Detect device GPS position (Privacy-Safe approx coordinates)"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsActive ? 'text-emerald-500 animate-pulse' : ''}`} />
          <span>{gpsActive ? 'Device GPS Active' : 'Use My Current Location'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{gpsError} Using manual Country-State-City selector hierarchy instead.</span>
        </div>
      )}

      {/* Hierarchical Cascading Dropdowns: Country -> State -> District -> City -> Locality */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
            Country
          </label>
          <select
            value={country || activeCountryObj.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            {SAMPLE_HIERARCHIES.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
            State / Region
          </label>
          <select
            value={state || activeStateObj.name}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            {activeCountryObj.states.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
            District / Zone
          </label>
          <select
            value={district || activeDistrictObj.name}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            {activeStateObj.districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
            City / Hub
          </label>
          <select
            value={city || activeCityObj.name}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            {activeDistrictObj.cities.map((ct) => (
              <option key={ct.name} value={ct.name}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">
            Locality / Ground
          </label>
          <select
            value={locality || (activeCityObj.localities[0] || 'All')}
            onChange={(e) => handleLocalityChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
          >
            <option value="All">All Localities</option>
            {activeCityObj.localities.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
