"use client";
import { useState } from "react";
import { useNewLocationStore } from "~/app/_state/new-location.store";
import { useUIStore } from "../_state/ui.store";
import { ARTISTS, type LocationItem } from "../common/locations";
import { addPlace } from "~/lib/custom-map";
import { useMapStore } from "../_state/map.store";
import mapboxgl from "mapbox-gl";

export default function NewLocationModal() {
  const { newLocationModalOpen, setNewLocationModalOpen } = useUIStore();
  const {
    songTitle,
    setSongTitle,
    artists,
    setArtists,
    videoUrl,
    setVideoUrl,
    address,
    setAddress,
    locationCoordinates,
    setLocationCoordinates,
    streetView,
    setStreetView,
  } = useNewLocationStore();

  const [artistToAdd, setArtistToAdd] = useState<string>("");

  if (!newLocationModalOpen) return null;

  function retrieveVideoIdFromUrl(url: string) {
    if (url.includes("v=")) {
      const videoId = url?.split("v=")[1]?.split("&")[0];
      return videoId;
    }

    if (url.includes("youtu.be")) {
      const videoId = url?.split("youtu.be/")[1]?.split("?")[0];
      return videoId;
    }

    return null;
  }

  function addLocationMarkerToMap() {
    if (!locationCoordinates || !songTitle || !artists || !videoUrl || !address)
      return;

    const imageUrl = `https://i.ytimg.com/vi/${retrieveVideoIdFromUrl(videoUrl)}/maxresdefault.jpg`;

    const lat = parseFloat(locationCoordinates.split(",")[0] ?? "0") ?? 0;
    const lng = parseFloat(locationCoordinates.split(",")[1] ?? "0") ?? 0;
    const newLocation: LocationItem = {
      id: songTitle,
      artists,
      contributors: null,
      url: videoUrl,
      isCustom: true,
      image: imageUrl ?? "",
      lat,
      lng,
      address,
      name: songTitle,
      streetView,
    };
    const { map } = useMapStore.getState();
    addPlace(newLocation, map ?? undefined);
    setNewLocationModalOpen(false);

    const locationData = new mapboxgl.LngLat(lng, lat);
    map?.flyTo({
      center: locationData,
      zoom: 13,
    });

    resetForm();
  }

  function resetForm() {
    setSongTitle("");
    setArtists([]);
    setVideoUrl("");
    setAddress("");
    setLocationCoordinates("");
    setStreetView("");
  }

  function handleAddArtist() {
    if (!artistToAdd) return;
    const updated = [artistToAdd, ...artists];
    setArtists(updated);
    setArtistToAdd("");
  }

  function handleRemoveArtist(artist: string) {
    const updated = artists.filter((a) => a !== artist);
    setArtists(updated);
  }

  const mailtoSubject = "Cantopop地圖: New Location Submission";
  const mailtoBody = [
    `Song Title: ${songTitle || ""}`,
    `Artists: ${(artists || []).join(", ")}`,
    `Video URL: ${videoUrl || ""}`,
    `Address: ${address || ""}`,
    `Coordinates: ${locationCoordinates || ""}`,
    `Street View: ${streetView || ""}`,
  ].join("\r\n");
  const mailtoParams = new URLSearchParams({
    subject: mailtoSubject,
    body: mailtoBody,
  });
  const mailtoHref = `mailto:devon@langpal.com.hk?${mailtoParams.toString()}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-white">
      <div className="flex h-fit w-[30rem] flex-col items-center justify-start rounded-lg bg-black/50 p-4">
        <div className="flex w-full flex-row items-start justify-between">
          <h1>New Location</h1>
          <button type="button" onClick={() => setNewLocationModalOpen(false)}>
            Close
          </button>
        </div>
        <hr className="my-1 w-full" />
        <div className="flex w-full flex-col items-center justify-start gap-2">
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Song Title</p>
            <input
              type="text"
              placeholder="Song Title"
              className="w-full rounded-md bg-black/50 p-2 text-white"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Artist/s</p>
            <div className="flex w-full flex-row items-center gap-2">
              <select
                className="w-full rounded-md bg-black/50 p-2 text-white"
                value={artistToAdd}
                onChange={(e) => setArtistToAdd(e.target.value)}
              >
                <option value="">Select artist</option>
                {ARTISTS.map((artist) => (
                  <option key={artist} value={artist}>
                    {artist}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-md bg-white p-2 text-black"
                onClick={handleAddArtist}
              >
                Add
              </button>
            </div>
            {artists?.length > 0 ? (
              <div className="flex w-full flex-wrap items-center gap-2">
                {artists?.map((artist) => (
                  <span
                    key={artist}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"
                  >
                    {artist}
                    <button
                      type="button"
                      aria-label={`Remove ${artist}`}
                      className="rounded-full bg-white/20 px-2 text-xs"
                      onClick={() => handleRemoveArtist(artist)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-70">No artists added yet.</p>
            )}
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Video URL (with timestamp)</p>
            <input
              type="text"
              placeholder="https://youtu.be/BdNKxYgTAFU?t=222"
              className="w-full rounded-md bg-black/50 p-2 text-white"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Address</p>
            <input
              type="text"
              placeholder="Address (e.g. 123 Main St, Central, HK)"
              className="w-full rounded-md bg-black/50 p-2 text-white"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Latitude & Longitude</p>
            <div className="flex w-full flex-row items-start justify-start gap-2">
              <input
                type="text"
                placeholder="22.280535,114.157731"
                className="w-full rounded-md bg-black/50 p-2 text-white"
                value={locationCoordinates}
                onChange={(e) => setLocationCoordinates(e.target.value)}
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-sm font-bold">Street View (optional)</p>
            <input
              type="text"
              placeholder="https://maps.app.goo.gl/BvQZ3PEo2iVUVAq18"
              className="w-full rounded-md bg-black/50 p-2 text-white"
              value={streetView}
              onChange={(e) => setStreetView(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-row items-start justify-center gap-6">
            <button
              type="button"
              className="rounded-md bg-white p-2 text-black"
              onClick={addLocationMarkerToMap}
            >
              Add Location
            </button>

            <a href={mailtoHref} className="rounded-md bg-white p-2 text-black">
              Submit Location
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
