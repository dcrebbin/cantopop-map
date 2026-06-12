import { MAP_LOCATIONS } from "../common/locations";

const siteUrl =
  import.meta.env.NEXT_PUBLIC_SITE_URL ?? import.meta.env.SITE_URL ?? "";

export function HomePageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Cantopop Map",
        alternateName: "粵語歌地圖",
        description:
          "Interactive map of Hong Kong locations featured in Cantonese pop music videos and songs",
        inLanguage: ["en", "zh-HK"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/?title={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "Cantopop Map",
        alternateName: "粵語歌地圖",
        url: siteUrl,
        applicationCategory: "Entertainment",
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript",
        description:
          "Explore Hong Kong locations from your favourite Cantonese pop songs on an interactive map",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Interactive map of cantopop filming locations",
          "Street view integration",
          "Music video links",
          "Location search",
        ],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Cantopop Map",
        url: siteUrl,
        logo: `${siteUrl}/icons/cantopop-512x512.png`,
        sameAs: [],
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#locationlist`,
        name: "Cantopop Music Video Locations",
        description:
          "A curated list of Hong Kong locations featured in Cantonese pop music videos",
        numberOfItems: MAP_LOCATIONS.length,
        itemListElement: MAP_LOCATIONS.slice(0, 10).map((location, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Place",
            name: location.address,
            description: `Filming location for "${location.name}" by ${location.artists.join(", ")}`,
            geo: {
              "@type": "GeoCoordinates",
              latitude: location.lat,
              longitude: location.lng,
            },
            url: `${siteUrl}/locations/${encodeURIComponent(location.name)}`,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
