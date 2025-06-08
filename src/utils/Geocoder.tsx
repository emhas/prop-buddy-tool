export async function geocodeAddress(address: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();
  
    if (data.length === 0) return null;
  
    const { lat, lon } = data[0];
    return [parseFloat(lat), parseFloat(lon)];
  }  