import mapboxgl from "mapbox-gl";
import { constructTitle, type LocationItem } from "~/app/common/locations";
import { useMapStore } from "~/app/_state/map.store";
import { shareIcon } from "./icons/shareIcon";
import { streetViewIcon } from "./icons/streetViewIcon";
import { locationIcon } from "./icons/locationIcon";
import { youtubeIcon } from "./icons/youtubeIcon";

function createCustomMarker(
  popup: mapboxgl.Popup,
  data: LocationItem,
  mapInstance?: mapboxgl.Map,
) {
  const markerElement = document.createElement("div");

  const image = document.createElement("img");
  image.src = data.image;
  image.className = "w-auto h-14 cursor-pointer mt-8 z-[1000] rounded-md";
  image.onclick = () => {
    const targetMap = mapInstance;
    if (!targetMap) return;
    const contentIsVisible = markerElement.classList.contains("visible");
    const { lastPopup: currentLastPopup, lastMarker: currentLastMarker } =
      useMapStore.getState();

    const songTitle = constructTitle(data);

    if (contentIsVisible) {
      window.history.pushState({}, "", "/");
      hidePopup(popup, markerElement);
    } else {
      if (currentLastPopup !== null && currentLastMarker !== null) {
        hidePopup(currentLastPopup, currentLastMarker);
      }
      const content = createPopupContent(data);
      popup.setDOMContent(content);
      popup.addTo(targetMap);
      markerElement.classList.add("visible");
      useMapStore.getState().setSelectedLocationId(data.id);
      useMapStore.getState().setLastPopup(popup);
      useMapStore.getState().setLastMarker(markerElement);
      window.history.pushState({}, "", `/?title=${songTitle}`);
    }
  };
  markerElement.dataset.artist = data.artists.join(", ");
  markerElement.dataset.song = data.name;
  markerElement.style.marginTop = "40px";
  markerElement.appendChild(image);

  return markerElement;
}

export function addPlace(data: LocationItem, mapInstance?: mapboxgl.Map) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    closeOnMove: false,
    focusAfterOpen: false,
  });

  const targetMap = mapInstance;
  if (!targetMap) return;

  const markerElement = createCustomMarker(popup, data, targetMap);

  new mapboxgl.Marker({
    element: markerElement,
    anchor: "bottom",
  })
    .setLngLat([data.lng, data.lat])
    .addTo(targetMap);

  useMapStore.getState().addMarker(markerElement);
  popup.setLngLat([data.lng, data.lat]);
}

function hidePopup(popup: mapboxgl.Popup, marker: HTMLDivElement) {
  popup.remove();
  marker.classList.remove("visible");
  useMapStore.getState().clearSelectedLocation();
}

function createPopupContent(data: LocationItem) {
  const container = document.createElement("div");
  container.className =
    "max-w-[150px] min-w-[90px] h-fit rounded-md bg-white p-2 flex flex-col items-center justify-center top-24";
  container.tabIndex = -1;

  const artistName = document.createElement("p");
  artistName.className = "text-base text-center font-bold";
  artistName.style.wordWrap = "break-word";
  artistName.style.maxWidth = "100%";
  artistName.textContent = data.artists.join(", ");
  container.appendChild(artistName);

  const songTitle = document.createElement("p");
  songTitle.className = "text-xs text-center";
  songTitle.textContent = data.name;
  container.appendChild(songTitle);

  const address = document.createElement("p");
  address.className = "text-xs text-center";
  address.textContent = data.address;
  container.appendChild(address);
  const linksContainer = document.createElement("div");
  linksContainer.className = "flex items-center justify-center gap-2";

  const videoUrl = document.createElement("a");
  videoUrl.href = data.url;
  videoUrl.target = "_blank";
  const youtubeSvg = document.createElement("svg");
  youtubeSvg.innerHTML = youtubeIcon;
  videoUrl.appendChild(youtubeSvg);
  linksContainer.appendChild(videoUrl);

  const shareButton = document.createElement("button");
  shareButton.addEventListener("click", async () => {
    await navigator.share({
      title: `Checkout this Cantopop地圖 location from ${data.artists.join(", ")}`,
      url: document.URL,
    });
  });

  const shareSvg = document.createElement("svg");
  shareSvg.innerHTML = shareIcon;
  shareButton.appendChild(shareSvg);
  linksContainer.appendChild(shareButton);

  const streetViewUrl = document.createElement("a");
  streetViewUrl.href =
    data.streetView ??
    `https://www.google.com/maps/@${data.lat},${data.lng},18z`;
  streetViewUrl.target = "_blank";
  const streetViewUrlSvg = document.createElement("svg");
  streetViewUrlSvg.innerHTML = streetViewIcon;
  streetViewUrl.appendChild(streetViewUrlSvg);
  linksContainer.appendChild(streetViewUrl);

  const locationUrl = document.createElement("a");
  locationUrl.href = `https://www.google.com/maps/dir//${data.lat},${data.lng}/`;
  locationUrl.target = "_blank";
  const locationSvg = document.createElement("svg");
  locationSvg.innerHTML = locationIcon;
  locationUrl.appendChild(locationSvg);
  linksContainer.appendChild(locationUrl);

  container.appendChild(linksContainer);
  return container;
}
