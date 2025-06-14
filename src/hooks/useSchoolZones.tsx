import { useEffect, useState } from 'react';
import { Feature, FeatureCollection, Polygon } from 'geojson';

export function useSchoolZones() {
  const [zones, setZones] = useState<Feature<Polygon>[]>([]);

  useEffect(() => {
    fetch('/data/Secondary_Integrated_Year9_2026.geojson')
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        if (data?.features) {
          setZones(data.features as Feature<Polygon>[]);
        }
      })
      .catch((err) => {
        console.error("Failed to load school zones:", err);
        alert("⚠️ Error loading school zones. Please try again later.");
      });
  }, []);

  return zones;
}