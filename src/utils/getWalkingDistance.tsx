const API_KEY = import.meta.env.VITE_ORS_API_KEY;

export async function getWalkingDistance(start: [number, number], end: [number, number]) {
  const url = `https://api.openrouteservice.org/v2/directions/foot-walking`;

  const body = {
    coordinates: [[start[1], start[0]], [end[1], end[0]]],
    profile: "foot-walking",
    format: "json",
    radiuses: [500, 500] // Expanding search radius
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": API_KEY // ✅ Ensure this is included
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    console.log("ORS Response:", data); // ✅ Debugging output

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].summary.distance; // Returns distance in meters
    } else {
      console.warn("ORS response structure is unexpected:", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching walking distance from ORS:", error);
    return null;
  }
}
