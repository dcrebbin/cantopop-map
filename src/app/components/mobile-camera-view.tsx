/* eslint-disable no-alert */
"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { MAP_LOCATIONS, type LocationItem } from "../common/locations";
import { useUIStore } from "../_state/ui.store";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;
const FIELD_OF_VIEW_DEG = 60;

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

type PermissionStatus = "unknown" | "granted" | "denied";
type OrientationPermissionStatus = PermissionStatus | "unsupported";

type CameraViewState = {
  cameraError: string | null;
  locationError: string | null;
  orientationError: string | null;
  position: { lat: number; lng: number } | null;
  heading: number | null;
  cameraPermission: PermissionStatus;
  locationPermission: PermissionStatus;
  orientationPermission: OrientationPermissionStatus;
  requiresOrientationPermission: boolean;
  setupInProgress: boolean;
};

const initialCameraViewState: CameraViewState = {
  cameraError: null,
  locationError: null,
  orientationError: null,
  position: null,
  heading: null,
  cameraPermission: "unknown",
  locationPermission: "unknown",
  orientationPermission: "unknown",
  requiresOrientationPermission: false,
  setupInProgress: false,
};

type CameraViewAction =
  | { type: "reset" }
  | { type: "patch"; payload: Partial<CameraViewState> }
  | { type: "orientation_unsupported" }
  | { type: "orientation_capability_detected"; needsPermission: boolean };

function cameraViewReducer(
  state: CameraViewState,
  action: CameraViewAction,
): CameraViewState {
  switch (action.type) {
    case "reset":
      return initialCameraViewState;
    case "patch":
      return { ...state, ...action.payload };
    case "orientation_unsupported":
      return {
        ...state,
        requiresOrientationPermission: false,
        orientationPermission: "unsupported",
        orientationError: "Device orientation is not supported.",
      };
    case "orientation_capability_detected":
      return {
        ...state,
        requiresOrientationPermission: action.needsPermission,
        orientationPermission: action.needsPermission
          ? state.orientationPermission
          : "granted",
      };
    default:
      return state;
  }
}

function getGeolocationErrorMessage(
  error: GeolocationPositionError,
  base: string,
) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return `${base} Please allow location access in browser settings.`;
    case error.POSITION_UNAVAILABLE:
      return `${base} Position unavailable. Try moving to an open area and ensure Location Services are enabled.`;
    case error.TIMEOUT:
      return `${base} Request timed out. Try again.`;
    default:
      return `${base} Please retry or check your permissions.`;
  }
}

export default function MobileCameraView() {
  const { mobileCameraViewOpen } = useUIStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    cameraViewReducer,
    initialCameraViewState,
  );
  const {
    cameraError,
    locationError,
    orientationError,
    position,
    heading,
    cameraPermission,
    locationPermission,
    orientationPermission,
    requiresOrientationPermission,
    setupInProgress,
  } = state;

  const isActive = mobileCameraViewOpen;

  const stopCameraStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopLocationWatch = useCallback(() => {
    if (
      locationWatchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    ) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    dispatch({ type: "reset" });
  }, [isActive]);

  useEffect(() => {
    if (isActive) return;
    stopCameraStream();
    stopLocationWatch();
  }, [isActive, stopCameraStream, stopLocationWatch]);

  useEffect(() => {
    if (!isActive) return;
    if (typeof DeviceOrientationEvent === "undefined") {
      dispatch({ type: "orientation_unsupported" });
      return;
    }
    const needsPermission =
      typeof (
        DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<PermissionState>;
        }
      ).requestPermission === "function";
    dispatch({
      type: "orientation_capability_detected",
      needsPermission,
    });
  }, [isActive]);

  const ensureCameraAccess = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      dispatch({
        type: "patch",
        payload: {
          cameraPermission: "denied",
          cameraError: "Camera is not supported in this browser.",
        },
      });
      return false;
    }

    if (streamRef.current) {
      if (
        videoRef.current &&
        videoRef.current.srcObject !== streamRef.current
      ) {
        videoRef.current.srcObject = streamRef.current;
      }

      if (videoRef.current) {
        try {
          await videoRef.current.play();
        } catch {
          dispatch({
            type: "patch",
            payload: {
              cameraPermission: "denied",
              cameraError: "Unable to start camera stream. Tap to retry.",
            },
          });
          return false;
        }
      }

      dispatch({
        type: "patch",
        payload: { cameraPermission: "granted", cameraError: null },
      });
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          dispatch({
            type: "patch",
            payload: {
              cameraPermission: "denied",
              cameraError: "Unable to start camera stream. Tap to retry.",
            },
          });
          return false;
        }
      }

      dispatch({
        type: "patch",
        payload: { cameraPermission: "granted", cameraError: null },
      });
      return true;
    } catch (error) {
      console.error("Camera error:", error);
      dispatch({
        type: "patch",
        payload: {
          cameraPermission: "denied",
          cameraError:
            error instanceof Error
              ? error.message
              : "Unable to access the camera. Please allow camera access in settings.",
        },
      });
      return false;
    }
  }, []);

  const requestInitialLocationAccess = useCallback(async () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      dispatch({
        type: "patch",
        payload: {
          locationPermission: "denied",
          locationError:
            "Geolocation is not supported. Try using Safari or Chrome over HTTPS.",
        },
      });
      return false;
    }

    if (!window.isSecureContext) {
      dispatch({
        type: "patch",
        payload: {
          locationPermission: "denied",
          locationError:
            "Geolocation requires HTTPS. On iOS, open this site over https in Safari and allow location.",
        },
      });
      return false;
    }

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dispatch({
            type: "patch",
            payload: {
              position: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              },
              locationPermission: "granted",
              locationError: null,
            },
          });
          resolve(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          dispatch({
            type: "patch",
            payload: {
              locationPermission: "denied",
              locationError: getGeolocationErrorMessage(
                error,
                "Unable to determine your location.",
              ),
            },
          });
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }, []);

  const startLocationWatch = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator) ||
      !window.isSecureContext ||
      locationWatchIdRef.current !== null
    ) {
      return;
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch({
          type: "patch",
          payload: {
            position: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
            locationPermission: "granted",
            locationError: null,
          },
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          dispatch({
            type: "patch",
            payload: { locationPermission: "denied" },
          });
          stopLocationWatch();
        }
        dispatch({
          type: "patch",
          payload: {
            locationError: getGeolocationErrorMessage(
              error,
              "Unable to determine your location.",
            ),
          },
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [stopLocationWatch]);

  const requestOrientationAccess = useCallback(async () => {
    if (typeof DeviceOrientationEvent === "undefined") {
      dispatch({ type: "orientation_unsupported" });
      return true;
    }

    const requestPermission = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState>;
      }
    ).requestPermission;

    if (typeof requestPermission !== "function") {
      dispatch({
        type: "patch",
        payload: {
          orientationPermission: "granted",
          orientationError: null,
        },
      });
      return true;
    }

    try {
      const result = await requestPermission();
      if (result === "granted") {
        dispatch({
          type: "patch",
          payload: {
            orientationPermission: "granted",
            orientationError: null,
          },
        });
        return true;
      }

      dispatch({
        type: "patch",
        payload: {
          orientationPermission: "denied",
          orientationError:
            "Orientation permission denied. Enable motion & orientation access in Settings > Safari > Motion & Orientation Access.",
        },
      });
      return false;
    } catch (error) {
      console.error("Orientation permission error:", error);
      dispatch({
        type: "patch",
        payload: {
          orientationPermission: "denied",
          orientationError: "Could not request orientation permission. Try again.",
        },
      });
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isActive || cameraPermission !== "granted") return;
    void ensureCameraAccess();
  }, [cameraPermission, ensureCameraAccess, isActive]);

  useEffect(() => {
    if (!isActive || locationPermission !== "granted") return;
    startLocationWatch();

    return () => {
      stopLocationWatch();
    };
  }, [isActive, locationPermission, startLocationWatch, stopLocationWatch]);

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
        dispatch({ type: "patch", payload: { heading: normalized } });
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
    const computed = MAP_LOCATIONS.flatMap((location) => {
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

      const inField = Math.abs(relativeBearing) <= FIELD_OF_VIEW_DEG / 2;
      if (!inField) return [];

      const horizontalPercent =
        ((relativeBearing + FIELD_OF_VIEW_DEG / 2) / FIELD_OF_VIEW_DEG) * 100;

      const maxDistanceKm = 10;
      const normalizedDistance = Math.min(distanceKm / maxDistanceKm, 1);
      const verticalPercent = 20 + normalizedDistance * 60;

      return [
        {
          location,
          distanceKm,
          bearing,
          relativeBearing,
          horizontalPercent: Math.min(Math.max(horizontalPercent, 0), 100),
          verticalPercent,
        },
      ];
    });

    return computed;
  }, [heading, position]);

  const sortedAnnotations = useMemo(() => {
    return [...annotations]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);
  }, [annotations]);

  const hasRequiredPermissions =
    cameraPermission === "granted" &&
    locationPermission === "granted" &&
    (orientationPermission === "granted" ||
      orientationPermission === "unsupported");
  const needsPermissionGate = !hasRequiredPermissions;
  const showOverlayMessage =
    !!cameraError || !!locationError || !!orientationError;

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        aria-label="Camera preview"
        muted
        playsInline
        autoPlay
      />

      <div className="pointer-events-none absolute inset-0 h-full w-full">
        {sortedAnnotations.map((entry, index) => locationMarker(entry, index))}
      </div>

      {needsPermissionGate ? (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 p-6 text-center text-white">
          <div className="flex max-w-sm flex-col items-center gap-4">
            <p className="text-lg font-semibold">
              Allow camera, location, and motion access to place locations
              around you.
            </p>
            <p className="text-sm text-white/75">
              Requesting these together is more reliable on iPhone and other
              mobile browsers.
            </p>
            <button
              type="button"
              disabled={setupInProgress}
              className="pointer-events-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg"
              onClick={async () => {
                dispatch({
                  type: "patch",
                  payload: {
                    setupInProgress: true,
                    cameraError: null,
                    locationError: null,
                    ...(orientationPermission !== "unsupported"
                      ? { orientationError: null }
                      : {}),
                  },
                });

                await requestOrientationAccess();
                await ensureCameraAccess();
                await requestInitialLocationAccess();

                dispatch({
                  type: "patch",
                  payload: { setupInProgress: false },
                });
              }}
            >
              {setupInProgress
                ? "Requesting Permissions..."
                : cameraPermission === "denied" ||
                    locationPermission === "denied" ||
                    (requiresOrientationPermission &&
                      orientationPermission === "denied")
                  ? "Retry Permissions"
                  : "Enable Camera View"}
            </button>
          </div>
        </div>
      ) : null}

      {showOverlayMessage ? (
        <div className="pointer-events-auto absolute left-0 right-0 z-[120] m-4 rounded-2xl bg-black/70 p-4 text-sm text-white backdrop-blur">
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
    </div>
  );

  function locationMarker(entry: AnnotatedLocation, index: number) {
    return (
      <div
        key={entry.location.id}
        className="absolute relative flex h-28 w-48 flex-col items-center overflow-hidden rounded-xl border border-white/40 bg-black/50 text-center text-white backdrop-blur-lg"
        style={{
          left: `calc(${entry.horizontalPercent}% - 6rem)`,
          top: `${entry.verticalPercent}%`,
          zIndex: sortedAnnotations.length - index,
          transition: "left 0.15s ease-out, top 0.15s ease-out",
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
          className="absolute inset-0 z-[0] h-full w-full rounded-xl object-cover brightness-[30%]"
        />
      </div>
    );
  }
}
