import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/location/address")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { address } = (await request.json()) as { address: string };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
          );
          const data = (await response.json()) as {
            lat: string;
            lon: string;
            display_name: string;
            address: {
              country: string;
              city?: string;
              town?: string;
              village?: string;
            };
          }[];

          if (data.length === 0) {
            return Response.json({ error: "No location found" }, { status: 404 });
          }

          const coordinates = {
            latitude: parseFloat(data[0]?.lat ?? "0"),
            longitude: parseFloat(data[0]?.lon ?? "0"),
          };

          return Response.json({ coordinates });
        } catch (error) {
          console.error("Error fetching location:", error);
          return Response.json(
            { error: "Failed to fetch location" },
            { status: 500 },
          );
        }
      },
    },
  },
});
