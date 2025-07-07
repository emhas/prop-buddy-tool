import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Feature, Polygon } from 'geojson';
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
  schoolZones: Feature<Polygon>[];
  station: { name: string; lat: number; lon: number; toCBDMinutes?: number } | null;
}

function useForceRedraw() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, []);
}

function SchoolZoneLayer({ zones }: { zones: Feature<Polygon>[] }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  useForceRedraw();

  useEffect(() => {
    if (layerRef.current && zones.length > 0) {
      map.removeLayer(layerRef.current);
    }

    if (zones.length === 0) return;

    const layer = L.geoJSON(zones, {
      style: (feature) => {
      const zoneType = feature?.properties?.zoneType;
      return {
        color:
          zoneType === 'primary'
            ? '#10b981'
            : zoneType === 'secondary'
            ? '#ef4444'
            : '#6366f1',
        fillOpacity: 0.2,
        weight: 2,
      };
console.log('Feature style zoneType:', feature?.properties?.zoneType, feature?.properties?.School_Name);
    },
     onEachFeature: (feature, layer) => {
        const name = feature.properties?.School_Name || 'Unknown';
        const type = feature.properties?.zoneType || 'Zone';
        layer.bindPopup(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${name}`);
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
    <div style={{ position: 'relative', width: '100%', height: '550px', backgroundColor: '#f9fafb' }}>
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
