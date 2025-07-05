import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import { geocodeAddress } from './utils/Geocoder';
import { useSchoolZones } from './hooks/useSchoolZones';
import { Feature, Polygon } from 'geojson';
import { point, booleanPointInPolygon } from '@turf/turf';
import { findNearestStation } from './utils/findNearestStation';

function App() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [position, setPosition] = useState<[number, number]>([-37.915, 145.017]);
  const [selectedZones, setSelectedZones] = useState<Feature<Polygon>[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [nearestStation, setNearestStation] = useState<{ name: string; lat: number; lon: number; toCBDMinutes?: number; walkingDistance?: number } | null>(null);
  const zones = useSchoolZones();

   // 📨 Handle incoming share target
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("shared");
    const sharedText = params.get("text") || params.get("url");

    if (shared && sharedText) {
      setAddress(sharedText);
      handleSearch(sharedText);
    }
  }, []);
  
  useEffect(() => {
    if (address.trim().length < 3) return;

    const delay = setTimeout(async () => {
      const viewbox = '144.5,-38.5,145.5,-37.5';
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&addressdetails=1&limit=5&bounded=1&viewbox=${viewbox}&autocomplete=1`;

      const res = await fetch(endpoint);
      const data = await res.json();

      const results = data.map((item: any) => ({
        title: item.display_name,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
      }));

      setSuggestions(results);
    }, 300);

    return () => clearTimeout(delay);
  }, [address]);

  const handleSearch = async (addr: string) => {
    const result = await geocodeAddress(addr.trim());
    if (!result) return alert('Address not found.');

    const userPoint = point([result[1], result[0]]);
    const matchedZone = zones.find((zone) => booleanPointInPolygon(userPoint, zone));

    if (matchedZone) {
      setSelectedZones([{ ...matchedZone }]);
      setSelectedSchool(matchedZone.properties?.School_Name || 'Unknown');
    } else {
      alert('No school zone found for this address.');
      setSelectedZones([]);
      setSelectedSchool(null);
    }

    setPosition(result);
    const nearest = await findNearestStation(result[0], result[1]);
    if (nearest) setNearestStation(nearest);
    setSuggestions([]);
  };

  const handleSelect = (s: any) => {
    setAddress(s.title);
    setPosition([parseFloat(s.lat), parseFloat(s.lon)]);
    handleSearch(s.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex flex-col items-center py-8 font-sans">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center tracking-tight text-slate-800">
          🏡 Prop Buddy
        </h2>
        <p className="text-center text-sm text-slate-500">Melbourne School Zones + Transport Lookup</p>
      </div>

      <div className="w-full max-w-[1100px] mx-auto bg-white/90 p-6 rounded-xl shadow-2xl flex flex-col md:flex-row gap-6 items-start">
        {/* Address Search */}
        <div className="bg-white p-4 rounded-xl shadow-md max-w-lg flex flex-col gap-3 flex-shrink-0 border border-slate-200">
          <h4 className="text-lg font-semibold text-slate-700">Search for an Address</h4>
          <div className="relative w-full">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Search address…"
              className="w-full border border-slate-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {!!address && (
              <button
                onClick={() => setAddress('')}
                className="absolute right-3 top-[50%] translate-y-[-50%] text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 border border-slate-300 rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={s.place_id || idx}
                    onClick={() => handleSelect(s)}
                    className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700"
                  >
                    {s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="flex-grow min-w-0 flex justify-center">
          <MapView position={position} schoolZones={selectedZones} station={nearestStation} />
        </div>

        {/* Info Panel */}
        <div className="w-[350px] bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex-shrink-0">
          <h4 className="text-xl font-semibold mb-3 text-slate-800">📋 Property Info</h4>
          {selectedSchool || nearestStation ? (
            <>
              {selectedSchool && (
                <div className="mb-3 border-b pb-2 border-slate-200">
                  <p className="text-slate-600">
                    🏫 School Zone:
                    <span className="text-indigo-700 font-medium"> {selectedSchool}</span>
                  </p>
                </div>
              )}
              {nearestStation && (
                <div className="space-y-1">
                  <p className="text-slate-600">
                    🚆 Nearest Train:
                    <span className="text-green-700 font-medium"> {nearestStation.name}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    ⏳ {nearestStation.toCBDMinutes} min to CBD (est.)
                  </p>
                  {nearestStation.walkingDistance && (
                    <p className="text-sm text-slate-500">
                      🚶 {nearestStation.walkingDistance}m walk to home
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm italic text-slate-400">Search to view results.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
