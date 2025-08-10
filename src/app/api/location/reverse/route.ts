

export async function POST(req: Request) {
  const { latitude, longitude } = await req.json() as { latitude: number, longitude: number };
  console.log(latitude, longitude);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const data = await response.json() as { address: {
        country: string; city?: string, town?: string, village?: string 
} };

    console.log(data);
    const cityName = data.address.city ?? data.address.town ?? data.address.village ?? 'Unknown';
    const countryName = data.address.country ?? 'Unknown';
    console.log(data);
    return new Response(JSON.stringify({ cityName, countryName }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch location' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}