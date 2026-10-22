import { MAP_LOCATIONS } from "../common/lib";
import { SITE_URL as siteUrl, locationPath } from "../common/seo";

export function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Script contents are raw text: JSX children would HTML-escape the JSON.
      // Escaping '<' also prevents a credit or title from closing the script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function HomePageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Cantopop Map",
        alternateName: ["粵語歌地圖", "廣東歌地圖"],
        description:
          "粵語歌及廣東歌 MV 拍攝地點地圖，收錄香港及海外取景地、歌曲與音樂錄像製作名單。Explore Cantopop music video filming locations and credits.",
        inLanguage: ["zh-Hant-HK", "en"],
        publisher: { "@id": `${siteUrl}/#organization` },
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
          "探索廣東歌 MV 在香港及海外的拍攝地點。Explore Cantopop music video filming locations in Hong Kong and overseas.",
        inLanguage: ["zh-Hant-HK", "en"],
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
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#locationlist`,
        name: "Cantopop Music Video Locations",
        description:
          "粵語歌 MV 拍攝地點，包括香港及海外取景地。Cantopop music video filming locations in Hong Kong and overseas.",
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
            url: `${siteUrl}${locationPath(location)}`,
          },
        })),
      },
    ],
  };

  return <JsonLdScript data={jsonLd} />;
}
