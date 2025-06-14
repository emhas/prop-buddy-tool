import { useState } from 'react';
import MapView from './components/MapView';
import { geocodeAddress } from './utils/Geocoder';
import { useSchoolZones } from './hooks/useSchoolZones';
import { Feature, Polygon } from 'geojson';
import { point, booleanPointInPolygon } from '@turf/turf';
import Autosuggest from 'react-autosuggest';
import { findNearestStation } from './utils/findNearestStation'; // New import

// Debounce utility
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Sanitize user input
const cleanInput = (value: string) =>
  value
    .replace(/(\d+),/, '$1')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();

// Debounced suggestion fetcher
const debouncedFetchSuggestions = debounce(
  async (value: string, setFn: Function) => {
    if (value.trim().length < 3) return;

    const cleaned = cleanInput(value);
    const viewbox = '144.5,-38.5,145.5,-37.5'; // Melbourne bounding box
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleaned
    )}&format=json&addressdetails=1&limit=5&bounded=1&viewbox=${viewbox}&autocomplete=1`;

    const response = await fetch(endpoint);
    const data = await response.json();

    const results = data.map((item: any) => ({
      title: item.display_name,
      lat: item.lat,
      lon: item.lon,
      place_id: item.place_id,
    }));

    setFn(results);
  },
  300
);

function App() {
  const [address, setAddress] = useState('');
  const [selectedZones, setSelectedZones] = useState<Feature<Polygon>[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [nearestStation, setNearestStation] = useState<{ name: string; lat: number; lon: number; toCBDMinutes: number; walkingDistance?: number } | null>(null);
  const [position, setPosition] = useState<[number, number]>([-37.915, 145.017]);
  const zones = useSchoolZones();

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
    
    // ✨ New: Find nearest station asynchronously
    const nearest = await findNearestStation(result[0], result[1]);
    setNearestStation(nearest);
    // 🚶 Fetch Walking Distance (with corrected parameters)
    if (nearest) {
    setNearestStation(nearest);
    }
  };

  const onChange = ({ newValue }: any) => {
    setAddress(newValue);
    debouncedFetchSuggestions(newValue, setSuggestions);
  };

  const onSuggestionsFetchRequested = ({ value }: any) => {
    debouncedFetchSuggestions(value, setSuggestions);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = ({ suggestion }: any) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setAddress(suggestion.title);
    setPosition([lat, lon]);
    onSuggestionsClearRequested();
    handleSearch(suggestion.title); // Auto-search on select
  };

  const inputProps = {
    placeholder: 'Enter address...',
    value: address,
    onChange,
    onFocus: () => {
      setAddress('');
      setSuggestions([]);
    },
  };

  const renderSuggestion = (suggestion: any) => (
    <div className="px-2 py-1 text-sm hover:bg-gray-100">{suggestion.title}</div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* Heading at top, full width */}
      <div className="py-6">
        <h2 className="text-2xl font-bold text-center">Property Insight Tool</h2>
      </div>
  
      {/* Main row layout */}
      <div className="w-full max-w-[1100px] mx-auto bg-white p-8 rounded-lg shadow-lg flex gap-6 items-start">
        
        {/* Address Search */}
        <div className="bg-white p-4 rounded-lg shadow-md max-w-lg flex items-center gap-4 flex-shrink-0">
          <h4 className="text-lg font-semibold whitespace-nowrap">Search for an Address</h4>
          <div className="flex-grow">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              onSuggestionSelected={onSuggestionSelected}
              getSuggestionValue={(suggestion: any) => suggestion.title}
              renderSuggestion={renderSuggestion}
              inputProps={inputProps}
            />
          </div>
        </div>
  
        {/* Map View */}
        <div className="flex-grow min-w-0 flex justify-center">
          <MapView position={position} schoolZones={selectedZones} station={nearestStation} />
        </div>
  
        {/* Property Info Panel */}
        <div className="w-[350px] bg-white p-4 rounded-lg shadow-lg flex-shrink-0">
          <h4 className="text-lg font-semibold mb-2">Property Info</h4>
  
          {selectedSchool ? (
            <div className="border-b pb-2 mb-2">
              <p className="font-medium text-gray-700">
                🏫 School Zone:  
                <span className="text-blue-700 font-semibold"> {selectedSchool}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No school zone found.</p>
          )}
  
          {nearestStation ? (
            <div>
              <p className="font-medium text-gray-700">
                🚆 Nearest Train Station:  
                <span className="text-green-700 font-semibold"> {nearestStation.name}</span>
              </p>
              <p className="text-gray-600">⏳ {nearestStation.toCBDMinutes} min to CBD (estimate only)</p>
              {nearestStation.walkingDistance && (
                <p className="text-gray-600">🚶 {nearestStation.walkingDistance} meters walk home (estimate only)</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No train station nearby.</p>
          )}
        </div>
      </div>
    </div>
  );
}  
export default App;
