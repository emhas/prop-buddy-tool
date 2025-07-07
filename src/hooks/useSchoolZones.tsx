import { useEffect, useState } from 'react';
import { Feature, FeatureCollection, GeoJsonProperties, Polygon } from 'geojson';

export interface SchoolZoneFeature extends Feature<Polygon, GeoJsonProperties> {
  properties: {
    School_Name: string;
    [key: string]: any;
  };
}

type Zones = {
  primary: SchoolZoneFeature[];
  secondary: SchoolZoneFeature[];
};

export function useSchoolZones(): Zones {
  const [primaryZones, setPrimaryZones] = useState<SchoolZoneFeature[]>([]);
  const [secondaryZones, setSecondaryZones] = useState<SchoolZoneFeature[]>([]);

  useEffect(() => {
    // Load Primary Zones
    fetch(import.meta.env.BASE_URL + 'data/Primary_Integrated_2025.geojson')
      .then(res => res.json())
      .then((data: FeatureCollection<Polygon, GeoJsonProperties>) => {
        if (data?.features) {
          setPrimaryZones(data.features as SchoolZoneFeature[]);
        }
      })
      .catch(err => {
        console.error('❌ Failed to load primary zones:', err);
      });

    // Load Secondary Zones
    fetch(import.meta.env.BASE_URL + 'data/Secondary_Integrated_Year9_2026.geojson')
      .then(res => res.json())
      .then((data: FeatureCollection<Polygon, GeoJsonProperties>) => {
        if (data?.features) {
          setSecondaryZones(data.features as SchoolZoneFeature[]);
        }
      })
      .catch(err => {
        console.error('❌ Failed to load secondary zones:', err);
      });
  }, []);

  return {
    primary: primaryZones,
    secondary: secondaryZones
  };
}
