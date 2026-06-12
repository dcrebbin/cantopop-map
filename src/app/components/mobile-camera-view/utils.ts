import type { LocationItem } from "../../common/locations";

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const EARTH_RADIUS_KM = 6371;
export const FIELD_OF_VIEW_DEG = 60;

export function toRadians(degrees: number) {
  return degrees * DEG2RAD;
}

export function toDegrees(radians: number) {
  return radians * RAD2DEG;
}

export function haversineDistanceKm(
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

export function calculateBearing(
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

export function shortestRotation(target: number, current: number) {
  return ((((target - current + 540) % 360) + 360) % 360) - 180;
}

export interface AnnotatedLocation {
  location: LocationItem;
  distanceKm: number;
  bearing: number;
  relativeBearing: number;
  horizontalPercent: number;
  verticalPercent: number;
}

export type PermissionStatus = "unknown" | "granted" | "denied";
export type OrientationPermissionStatus = PermissionStatus | "unsupported";

export type CameraViewState = {
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

export const initialCameraViewState: CameraViewState = {
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

export type CameraViewAction =
  | { type: "reset" }
  | { type: "patch"; payload: Partial<CameraViewState> }
  | { type: "orientation_unsupported" }
  | { type: "orientation_capability_detected"; needsPermission: boolean };

export function cameraViewReducer(
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

export function getGeolocationErrorMessage(
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
