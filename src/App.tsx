import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import { geocodeAddress } from './utils/Geocoder';
import { useSchoolZones } from './hooks/useSchoolZones';
import { Feature, Polygon } from 'geojson';
import { point, booleanPointInPolygon } from '@turf/turf';
import { findNearestStation } from './utils/findNearestStation';
import { getAncestryInfo } from './utils/getAncestryInfo';

function App() {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [position, setPosition] = useState<[number, number]>([-37.915, 145.017]);
  const [selectedZones, setSelectedZones] = useState<Feature<Polygon>[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<{ primary: string | null; secondary: string | null } | null>(null);
  const [nearestStation, setNearestStation] = useState<{ name: string; lat: number; lon: number; toCBDMinutes?: number; walkingDistance?: number } | null>(null);
  const [ancestryInfo, setAncestryInfo] = useState<any | null>(null);
  const { primary, secondary } = useSchoolZones();

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
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=5&bounded=1&viewbox=${viewbox}&autocomplete=1`;

      const res = await fetch(endpoint);
      const data = await res.json();

      setSuggestions(data.map((item: any) => ({
        title: item.display_name,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
      })));
    }, 300);

    return () => clearTimeout(delay);
  }, [address]);

  const handleSearch = async (addr: string) => {
    const result = await geocodeAddress(addr.trim());
    if (!result) return alert('Address not found.');

    const [lat, lon, metadata] = result;
    const userPoint = point([lon, lat]);

    const matchedPrimary = primary.find(zone => booleanPointInPolygon(userPoint, zone));
    const matchedSecondary = secondary.find(zone => booleanPointInPolygon(userPoint, zone));

    const matchedZones: Feature<Polygon>[] = [
      matchedPrimary ? { ...matchedPrimary, properties: { ...matchedPrimary.properties, zoneType: 'primary' } } : null,
      matchedSecondary ? { ...matchedSecondary, properties: { ...matchedSecondary.properties, zoneType: 'secondary' } } : null,
    ].filter(Boolean) as Feature<Polygon>[];

    setSelectedZones(matchedZones);
    setSelectedSchool({
      primary: matchedPrimary?.properties?.School_Name || null,
      secondary: matchedSecondary?.properties?.School_Name || null,
    });

    setPosition([lat, lon]);
    setSuggestions([]);

    const nearest = await findNearestStation(lat, lon);
    if (nearest) setNearestStation(nearest);

    const suburb = metadata?.suburb || '';
    setAncestryInfo(getAncestryInfo(suburb));
  };

  const handleSelect = (s: any) => {
    setAddress(s.title);
    handleSearch(s.title);
  };

  return (
    <div className="text-sm sm:text-base min-h-screen bg-gradient-to-br from-slate-100 to-white flex flex-col items-center py-8 font-sans">
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
              className="w-full text-base sm:text-lg border border-slate-300 px-4 py-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-slate-100 cursor-pointer text-slate-700"
                  >
                    <span className="block line-clamp-2 leading-snug">{s.title}</span>
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
          {(selectedSchool?.primary || selectedSchool?.secondary || nearestStation) ? (
            <>
              {(selectedSchool?.primary || selectedSchool?.secondary) && (
                <div className="mb-3 border-b pb-2 border-slate-200">
                  <p className="text-slate-600">
                    🏫 Zoned for:{' '}
                    <span className="text-indigo-700 font-medium">
                      {[selectedSchool?.primary, selectedSchool?.secondary].filter(Boolean).join(', ')}
                    </span>
                  </p>
                </div>
              )}
              {nearestStation && (
                <p className="text-slate-600">
                  🚆 Nearest Train:{' '}
                  <span className="text-green-700 font-medium">{nearestStation.name}</span>,{' '}
                  <span className="text-slate-500 text-xs sm:text-sm">{nearestStation.toCBDMinutes} min to CBD (est.)</span>
                  {nearestStation.walkingDistance && (
                    <>
                      {' '}
                      <span className="text-slate-500 text-xs sm:text-sm">🚶 {nearestStation.walkingDistance}m walk to home</span>
                    </>
                  )}
                </p>
              )}
              {ancestryInfo && (
                <div className="mt-4 border-t pt-3 text-slate-600 text-xs sm:text-sm">
                  🧬 <strong>Ancestries:</strong>{' '}
                  {ancestryInfo.ancestries.slice(0, 5).map((a: any) => `${a.group} ${a.percent}%`).join(', ')}
                  <span className="text-slate-400"> (2021 Census)</span>
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
