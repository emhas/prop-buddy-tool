export async function geocodeAddress(address: string): Promise<[number, number, { suburb: string }] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(address)}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.length === 0) return null;

  const { lat, lon, address: addr } = data[0];

  // Try various locality fields to extract suburb
  const suburb =
    addr?.suburb ||
    addr?.town ||
    addr?.village ||
    addr?.city_district ||
    addr?.city ||
    addr?.locality ||
    '';

  return [parseFloat(lat), parseFloat(lon), { suburb }];
}
