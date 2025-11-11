/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-alert */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LOCATIONS, type LocationItem } from "../common/locations";
import { useUIStore } from "../_state/ui.store";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;
const MAX_RENDER_DISTANCE_KM = 10;
const FIELD_OF_VIEW_DEG = 60;

function createDefaultTestLocation(
  overrides: Partial<LocationItem> = {},
): LocationItem {
  return {
    id: "__test_location",
    artists: ["Test Artist"],
    address: "Testing Address",
    name: "Testing Location",
    url: "https://example.com",
    image: "https://i.ytimg.com/vi/YPJljJJzKFo/maxresdefault.jpg",
    lat: 0,
    lng: 0,
    streetView: null,
    streetViewEmbed: null,
    mapEmbed: null,
    isCustom: true,
    contributors: null,
    ...overrides,
  };
}

function toRadians(degrees: number) {
  return degrees * DEG2RAD;
}

function toDegrees(radians: number) {
  return radians * RAD2DEG;
}

function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function calculateBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const φ1 = toRadians(fromLat);
  const φ2 = toRadians(toLat);
  const λ1 = toRadians(fromLng);
  const λ2 = toRadians(toLng);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const bearing = (toDegrees(θ) + 360) % 360;
  return bearing;
}

function shortestRotation(target: number, current: number) {
  return ((((target - current + 540) % 360) + 360) % 360) - 180;
}

interface AnnotatedLocation {
  location: LocationItem;
  distanceKm: number;
  bearing: number;
  relativeBearing: number;
  horizontalPercent: number;
  verticalPercent: number;
}

export default function MobileCameraView() {
  const { mobileCameraViewOpen } = useUIStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [orientationError, setOrientationError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [heading, setHeading] = useState<number | null>(null);
  const [orientationPermission, setOrientationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [requiresOrientationPermission, setRequiresOrientationPermission] =
    useState(false);

  const isActive = mobileCameraViewOpen;

  useEffect(() => {
    setCameraError(null);
    setLocationError(null);
    setOrientationError(null);
    setPosition(null);
    setHeading(null);
    setOrientationPermission("unknown");
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (typeof DeviceOrientationEvent === "undefined") {
      setOrientationError("Device orientation is not supported.");
      return;
    }
    const needsPermission =
      typeof (
        DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<PermissionState>;
        }
      ).requestPermission === "function";
    setRequiresOrientationPermission(needsPermission);
    if (!needsPermission) setOrientationPermission("granted");
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError("Camera is not supported in this browser.");
        return;
      }
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          try {
            await videoRef.current.play();
          } catch {
            setCameraError("Unable to start camera stream. Tap to retry.");
          }
        }
      } catch (error) {
        console.error("Camera error:", error);
        setCameraError(
          error instanceof Error
            ? error.message
            : "Unable to access the camera. Please allow camera access in settings.",
        );
      }
    }

    void startCamera();

    return () => {
      currentStream?.getTracks().forEach((track) => track.stop());
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (!("geolocation" in navigator)) {
      setLocationError(
        "Geolocation is not supported. Try using Safari or Chrome over HTTPS.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setLocationError(
        "Geolocation requires HTTPS. On iOS, open this site over https in Safari and allow location.",
      );
      return;
    }

    let watchId: number | null = null;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        const base = "Unable to determine your location.";
        let message = base;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = `${base} Please allow location access in browser settings.`;
            break;
          case error.POSITION_UNAVAILABLE:
            message = `${base} Position unavailable. Try moving to an open area and ensure Location Services are enabled.`;
            break;
          case error.TIMEOUT:
            message = `${base} Request timed out. Try again.`;
            break;
          default:
            message = `${base} Please retry or check your permissions.`;
        }
        setLocationError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || orientationPermission !== "granted") return;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let calculatedHeading: number | null = null;

      const anyEvent = event as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      };

      if (typeof anyEvent.webkitCompassHeading === "number") {
        calculatedHeading = anyEvent.webkitCompassHeading;
      } else if (typeof event.alpha === "number") {
        calculatedHeading = 360 - event.alpha;
      }

      if (
        typeof calculatedHeading === "number" &&
        !Number.isNaN(calculatedHeading)
      ) {
        const normalized = (calculatedHeading + 360) % 360;
        setHeading(normalized);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [isActive, orientationPermission]);

  const annotations = useMemo<AnnotatedLocation[]>(() => {
    if (!position || heading === null) {
      return [];
    }
    const computed = LOCATIONS.map((location) => {
      const distanceKm = haversineDistanceKm(
        position.lat,
        position.lng,
        location.lat,
        location.lng,
      );
      const bearing = calculateBearing(
        position.lat,
        position.lng,
        location.lat,
        location.lng,
      );
      const relativeBearing = shortestRotation(bearing, heading);

      const inField =
        Math.abs(relativeBearing) <= FIELD_OF_VIEW_DEG / 2 &&
        distanceKm <= MAX_RENDER_DISTANCE_KM;

      if (!inField) return null;

      const horizontalPercent =
        ((relativeBearing + FIELD_OF_VIEW_DEG / 2) / FIELD_OF_VIEW_DEG) * 100;

      const distanceRatio = Math.min(distanceKm / MAX_RENDER_DISTANCE_KM, 1);
      const verticalPercent = 40 + distanceRatio * 40;

      return {
        location,
        distanceKm,
        bearing,
        relativeBearing,
        horizontalPercent: Math.min(Math.max(horizontalPercent, 0), 100),
        verticalPercent,
      };
    }).filter(Boolean) as AnnotatedLocation[];

    return computed;
  }, [heading, position]);

  const sortedAnnotations = useMemo(() => {
    return [...annotations]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 25);
  }, [annotations]);

  const showOverlayMessage =
    !!cameraError || !!locationError || !!orientationError;
  const needsOrientationPrompt =
    requiresOrientationPermission && orientationPermission !== "granted";

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
        autoPlay
      />

      <div className="pointer-events-none absolute inset-0">
        {sortedAnnotations.map((entry, index) => locationMarker(entry, index))}
      </div>

      {needsOrientationPrompt ? (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 p-6 text-center text-white">
          <div className="flex max-w-sm flex-col items-center gap-4">
            <p className="text-lg font-semibold">
              Enable device orientation to place locations around you.
            </p>
            <button
              type="button"
              className="pointer-events-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg"
              onClick={async () => {
                try {
                  const result = await (
                    DeviceOrientationEvent as unknown as {
                      requestPermission: () => Promise<PermissionState>;
                    }
                  ).requestPermission();
                  if (result === "granted") {
                    setOrientationPermission("granted");
                    setOrientationError(null);
                  } else {
                    setOrientationPermission("denied");
                    setOrientationError(
                      "Orientation permission denied. Enable motion & orientation access in Settings > Safari > Motion & Orientation Access.",
                    );
                  }
                } catch (error) {
                  console.error("Orientation permission error:", error);
                  setOrientationError(
                    "Could not request orientation permission. Try again.",
                  );
                }
              }}
            >
              Enable Orientation
            </button>
          </div>
        </div>
      ) : null}

      {showOverlayMessage ? (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-[120] m-4 rounded-2xl bg-black/70 p-4 text-sm text-white backdrop-blur">
          {cameraError ? (
            <p className="mb-2 font-semibold">Camera: {cameraError}</p>
          ) : null}
          {locationError ? (
            <p className="mb-2 font-semibold">Location: {locationError}</p>
          ) : null}
          {orientationError ? (
            <p className="font-semibold">Orientation: {orientationError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white">
        <span className="font-semibold">
          {position
            ? `Lat ${position.lat.toFixed(4)}, Lng ${position.lng.toFixed(4)}`
            : "Locating..."}
        </span>
        <span className="text-white/70">|</span>
        <span>
          {heading !== null
            ? `Heading ${Math.round(heading)}°`
            : "Align device"}
        </span>
      </div>
    </div>
  );

  function locationMarker(entry: AnnotatedLocation, index: number) {
    return (
      <div
        key={entry.location.id}
        className="absolute flex h-28 w-48 -translate-x-1/2 flex-col items-center rounded-xl border border-white/40 bg-black/50 text-center text-white backdrop-blur-lg transition-transform duration-150"
        style={{
          left: `${entry.horizontalPercent}%`,
          top: `${entry.verticalPercent}%`,
          zIndex: sortedAnnotations.length - index,
        }}
      >
        <div className="relative z-[2] flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-white/80">
            {entry.distanceKm < 1
              ? `${Math.round(entry.distanceKm * 1000)} m`
              : `${entry.distanceKm.toFixed(1)} km`}
          </span>
          <strong className="text-base font-semibold leading-tight">
            {entry.location.name}
          </strong>
          <span className="text-sm text-white/75">
            {entry.location.artists.join(", ")}
          </span>
        </div>
        <img
          src={entry.location.image}
          alt={entry.location.name}
          className="absolute z-[0] h-full w-full rounded-xl object-cover brightness-[30%]"
        />
      </div>
    );
  }
}
