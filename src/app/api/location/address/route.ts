

export async function POST(req: Request) {
  const { address } = await req.json() as { address: string };
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
    const data: {
      lat: string;
      lon: string;
      display_name: string;
      address: {
        country: string; city?: string, town?: string, village?: string, lat: string, lon: string
} }[] = await response.json() as {
      lat: string;
      lon: string;
      display_name: string;
      address: {
        country: string; city?: string, town?: string, village?: string, lat: string, lon: string
} }[];

    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'No location found' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const coordinates = {
      latitude: parseFloat(data[0]?.lat ?? '0'),
      longitude: parseFloat(data[0]?.lon ?? '0'),
    };
 
    return new Response(JSON.stringify({ coordinates }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch location' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}