import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/location/reverse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { latitude, longitude } = (await request.json()) as {
          latitude: number;
          longitude: number;
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = (await response.json()) as {
            address: {
              country: string;
              city?: string;
              town?: string;
              village?: string;
            };
          };

          const cityName =
            data.address.city ?? data.address.town ?? data.address.village ?? "Unknown";
          const countryName = data.address.country ?? "Unknown";

          return Response.json({ cityName, countryName });
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
