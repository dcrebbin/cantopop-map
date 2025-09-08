"use client";
import { useState } from "react";
import { useNewLocationStore } from "~/app/_state/new-location.store";
import { useUIStore } from "../_state/ui.store";
import { ARTISTS } from "../common/locations";

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

  function submitLocation() {
    console.log(
      songTitle,
      artists,
      videoUrl,
      address,
      locationCoordinates,
      streetView,
    );
  }

  function addLocationMarkerToMap() {
    console.log(
      songTitle,
      artists,
      videoUrl,
      address,
      locationCoordinates,
      streetView,
    );
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

            <button
              type="button"
              onClick={submitLocation}
              className="rounded-md bg-white p-2 text-black"
            >
              Submit Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
