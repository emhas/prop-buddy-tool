import axios from "axios";

// Haversine formula to calculate the distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns the distance in kilometers
}

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

export async function findNearestStation(lat: number, lon: number) {
  const query = `
    [out:json];
    (
      node["railway"="station"](around:5000,${lat},${lon});
      way["railway"="station"](around:5000,${lat},${lon});
      relation["railway"="station"](around:5000,${lat},${lon});
    );
    out center; // IMPORTANT: include center for ways/relations to get lat/lon
  `;

  try {
    const response = await axios.post(OVERPASS_API_URL, query, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('Overpass Response:', response.data); // Log the response to check if we get valid data

    const stations = response.data.elements;
    if (!stations || stations.length === 0) {
      console.error("No stations found.");
      return null;
    }

    // Find the closest station
    let closestStation = stations[0];
    let minDistance = calculateDistance(
      lat,
      lon,
      closestStation.lat ?? closestStation.center?.lat,
      closestStation.lon ?? closestStation.center?.lon
    );

    const walkingDistanceMeters = Math.round(minDistance * 1000); // ✅ Convert km → meters

    for (const station of stations) {
      const stationLat = station.lat ?? station.center?.lat;
      const stationLon = station.lon ?? station.center?.lon;
      if (stationLat && stationLon) {
        const distance = calculateDistance(lat, lon, stationLat, stationLon);
        if (distance < minDistance) {
          minDistance = distance;
          closestStation = station;
        }
      }
    }

    const stationLat = closestStation.lat ?? closestStation.center?.lat;
    const stationLon = closestStation.lon ?? closestStation.center?.lon;

    if (!stationLat || !stationLon) {
      console.error("Closest station does not have valid lat/lon");
      return null;
    }

    // Simple estimation: assume 2 minutes per km to CBD
    const toCBDMinutes = Math.round(minDistance * 15);

    return {
      name: closestStation.tags?.name || "Unnamed Station",
      lat: stationLat,
      lon: stationLon,
      toCBDMinutes,
      walkingDistance: walkingDistanceMeters, // ✅ Added walking distance
    };
  } catch (error) {
    console.error("Error fetching nearest station:", error);
    return null;
  }
}
