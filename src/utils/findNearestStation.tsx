import axios from 'axios';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export async function findNearestStation(lat: number, lon: number) {
  const query = `
    [out:json][timeout:25];
    (
      node["railway"="station"](around:5000,${lat},${lon});
      way["railway"="station"](around:5000,${lat},${lon});
      relation["railway"="station"](around:5000,${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await axios.post(OVERPASS_API_URL, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const elements = response.data?.elements;
    if (!elements || elements.length === 0) {
      console.warn('No train stations found nearby.');
      return null;
    }

    // Identify closest station
    let closest = null;
    let minDistance = Infinity;

    for (const item of elements) {
      const slat = item.lat ?? item.center?.lat;
      const slon = item.lon ?? item.center?.lon;
      if (!slat || !slon) continue;

      const dist = haversineDistance(lat, lon, slat, slon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = { ...item, lat: slat, lon: slon };
      }
    }

    if (!closest) return null;

    return {
      name: closest.tags?.name || 'Unnamed Station',
      lat: closest.lat,
      lon: closest.lon,
      toCBDMinutes: Math.round(minDistance * 15), // Rough estimate
      walkingDistance: Math.round(minDistance * 1000), // meters
    };
  } catch (error) {
    console.error('Error fetching station from Overpass:', error);
    return null;
  }
}
