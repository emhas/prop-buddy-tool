import { LoadScript, GoogleMap, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "550px"
};

// ✅ Ensure API key is correctly accessed from `.env`
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapViewGoogleProps {
  position: [number, number];
  station: { name: string; lat: number; lon: number } | null;
}

export default function MapViewGoogle({ position, station }: MapViewGoogleProps) {
  return (
    <LoadScript googleMapsApiKey={API_KEY} libraries={["marker"]}> {/* ✅ Load Advanced Markers */}
      <GoogleMap mapContainerStyle={containerStyle} center={{ lat: position[0], lng: position[1] }} zoom={14}>
        
        {/* Home Marker using AdvancedMarkerElement */}
        <script async src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=marker`}></script>
        <div id="home-marker" style={{ position: "absolute", transform: "translate(-50%, -50%)" }}>
          <img src="/icons/home.png" alt="Home" />
        </div>

        {/* Train Station Marker using AdvancedMarkerElement */}
        {station && (
          <div id="station-marker" style={{ position: "absolute", transform: "translate(-50%, -50%)" }}>
            <img src="/icons/train.png" alt="Train Station" />
            <InfoWindow position={{ lat: station.lat, lng: station.lon }}>
              <div>
                <strong>{station.name}</strong>  
                <p>🚆 {station.toCBDMinutes} min to CBD</p>
              </div>
            </InfoWindow>
          </div>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
