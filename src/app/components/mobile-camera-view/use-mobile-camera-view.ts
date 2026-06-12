/* eslint-disable no-alert */
"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { MAP_LOCATIONS } from "../../common/locations";
import { useUIStore } from "../../_state/ui.store";
import {
  type AnnotatedLocation,
  calculateBearing,
  cameraViewReducer,
  FIELD_OF_VIEW_DEG,
  getGeolocationErrorMessage,
  haversineDistanceKm,
  initialCameraViewState,
  shortestRotation,
} from "./utils";

export function useMobileCameraView() {
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

  const requestAllPermissions = useCallback(async () => {
    await requestOrientationAccess();
    await ensureCameraAccess();
    await requestInitialLocationAccess();
  }, [
    ensureCameraAccess,
    requestInitialLocationAccess,
    requestOrientationAccess,
  ]);

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
    return MAP_LOCATIONS.flatMap((location) => {
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
  }, [heading, position]);

  const sortedAnnotations = useMemo(() => {
    return annotations
      .toSorted((a, b) => a.distanceKm - b.distanceKm)
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

  return {
    isActive,
    videoRef,
    dispatch,
    cameraError,
    locationError,
    orientationError,
    cameraPermission,
    locationPermission,
    orientationPermission,
    requiresOrientationPermission,
    setupInProgress,
    sortedAnnotations,
    needsPermissionGate,
    showOverlayMessage,
    requestAllPermissions,
  };
}
