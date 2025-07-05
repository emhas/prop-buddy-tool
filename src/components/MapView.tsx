import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Feature } from 'geojson';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import trainIcon from '../assets/icons/train.png';
import homeIcon from '../assets/icons/home.png';

const stationMarker = L.icon({
  iconUrl: trainIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 40],
  popupAnchor: [0, -30],
});

const homeMarker = L.icon({
  iconUrl: homeIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 40],
  popupAnchor: [0, -30],
});

interface MapViewProps {
  position: [number, number];
  schoolZones: Feature[];
  station: { name: string; lat: number; lon: number; toCBDMinutes?: number } | null;
}

function useForceRedraw() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, []);
}

function SchoolZoneLayer({ zones }: { zones: Feature[] }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  useForceRedraw();

  useEffect(() => {
    if (layerRef.current && zones.length > 0) {
      map.removeLayer(layerRef.current);
    }

    if (zones.length === 0) return;

    const layer = L.geoJSON(zones, {
      style: {
        color: 'red',
        fillOpacity: 0.2,
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties?.School_Name) {
          layer.bindPopup(feature.properties.School_Name);
        }
      },
    });

    layer.addTo(map);
    layerRef.current = layer;
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }, [zones, map]);

  return null;
}

export default function MapView({ position, schoolZones, station }: MapViewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '550px', backgroundColor: 'red' }}>
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '550px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={homeMarker}>
          <Popup>Selected Location</Popup>
        </Marker>

        {station && (
          <Marker position={[station.lat, station.lon]} icon={stationMarker}>
            <Popup>
              {station.name}
              {station.toCBDMinutes ? ` - ${station.toCBDMinutes} min to CBD` : ''}
            </Popup>
          </Marker>
        )}

        <SchoolZoneLayer zones={schoolZones} />
      </MapContainer>
    </div>
  );
}
