import { useState } from "react";
import MapViewGoogle from "./components/MapViewGoogle";
import { geocodeAddress } from "./utils/Geocoder";
import { useSchoolZones } from "./hooks/useSchoolZones";
import { Feature, Polygon } from "geojson";
import { point, booleanPointInPolygon } from "@turf/turf";
import Autosuggest from "react-autosuggest";
import { findNearestStation } from "./utils/findNearestStation";

function AppNew() {
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState<[number, number]>([-37.915, 145.017]);
  const [selectedZones, setSelectedZones] = useState<Feature<Polygon>[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [nearestStation, setNearestStation] = useState<{ name: string; lat: number; lon: number; toCBDMinutes: number } | null>(null);

  const zones = useSchoolZones();

  const handleSearch = async (addr: string) => {
    const result = await geocodeAddress(addr.trim());
    if (!result) return alert("Address not found.");

    const userPoint = point([result[1], result[0]]);
    const matchedZone = zones.find((zone) => booleanPointInPolygon(userPoint, zone));

    if (matchedZone) {
      setSelectedZones([{ ...matchedZone }]);
      setSelectedSchool(matchedZone.properties?.School_Name || "Unknown");
    } else {
      alert("No school zone found for this address.");
      setSelectedZones([]);
      setSelectedSchool(null);
    }

    setPosition(result);

    // ✨ New: Find nearest station asynchronously
    const nearest = await findNearestStation(result[0], result[1]);
    console.log("Nearest Station:", nearest);
    setNearestStation(nearest);
  };

  const onChange = (event: React.FormEvent<any>, { newValue }: any) => {
    setAddress(newValue);
  };

  const onSuggestionsFetchRequested = ({ value }: any) => {
    // Debounced fetch suggestions
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const inputProps = {
    placeholder: "Enter address...",
    value: address,
    onChange,
    onFocus: () => {
      setAddress("");
      setSuggestions([]);
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-row gap-6 px-8 max-w-[1280px] mx-auto justify-center items-center">
      <h1 className="text-xl font-bold">Property Insight Tool - Google Maps</h1>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md max-w-lg mx-auto">
        <h2 className="text-lg font-semibold mb-2">Search for an Address</h2>
        <Autosuggest
  suggestions={suggestions}
  onSuggestionsFetchRequested={onSuggestionsFetchRequested}
  onSuggestionsClearRequested={onSuggestionsClearRequested}
  multiSection={false} // ✅ Set to false unless you need grouped suggestions
  getSuggestionValue={(suggestion: any) => suggestion.title} // ✅ Extract value from suggestion object
  renderSuggestion={(suggestion: any) => (
    <div className="px-2 py-1 text-sm hover:bg-gray-100">{suggestion.title}</div>
  )}
  inputProps={{
    placeholder: "Enter address...",
    value: address,
    onChange,
    onFocus: () => {
      setAddress("");
      setSuggestions([]);
    }
  }}
/>      </div>

      {/* Property Info */}
      <div className="w-[350px] bg-white p-4 rounded-lg shadow-lg flex-shrink-0">
        <h2 className="text-lg font-semibold mb-2">Property Info</h2>

        {selectedSchool ? (
          <div className="border-b pb-2 mb-2">
            <p className="font-medium text-gray-700">
              🏫 School Zone: <span className="text-blue-700 font-semibold">{selectedSchool}</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No school zone found.</p>
        )}

        {nearestStation ? (
          <div>
            <p className="font-medium text-gray-700">
              🚆 Nearest Train Station: <span className="text-green-700 font-semibold">{nearestStation.name}</span>
            </p>
            <p className="text-gray-600">⏳ {nearestStation.toCBDMinutes} min to CBD</p>
          </div>
        ) : (
          <p className="text-gray-500">No train station nearby.</p>
        )}
      </div>

      {/* Google Maps */}
      <div className="flex-grow min-w-0 flex justify-center">
        <MapViewGoogle position={position} station={nearestStation} />
      </div>
    </div>
  );
}

export default AppNew;
