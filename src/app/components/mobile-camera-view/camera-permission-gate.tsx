import type { Dispatch } from "react";
import type {
  CameraViewAction,
  OrientationPermissionStatus,
  PermissionStatus,
} from "./utils";

type CameraPermissionGateProps = {
  setupInProgress: boolean;
  cameraPermission: PermissionStatus;
  locationPermission: PermissionStatus;
  orientationPermission: OrientationPermissionStatus;
  requiresOrientationPermission: boolean;
  dispatch: Dispatch<CameraViewAction>;
  onRequestPermissions: () => Promise<void>;
};

export function CameraPermissionGate({
  setupInProgress,
  cameraPermission,
  locationPermission,
  orientationPermission,
  requiresOrientationPermission,
  dispatch,
  onRequestPermissions,
}: CameraPermissionGateProps) {
  const permissionDenied =
    cameraPermission === "denied" ||
    locationPermission === "denied" ||
    (requiresOrientationPermission && orientationPermission === "denied");

  return (
    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 p-6 text-center text-white">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <p className="text-lg font-semibold">
          Allow camera, location, and motion access to place locations around
          you.
        </p>
        <p className="text-sm text-white/75">
          Requesting these together is more reliable on iPhone and other mobile
          browsers.
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

            await onRequestPermissions();

            dispatch({
              type: "patch",
              payload: { setupInProgress: false },
            });
          }}
        >
          {setupInProgress
            ? "Requesting Permissions..."
            : permissionDenied
              ? "Retry Permissions"
              : "Enable Camera View"}
        </button>
      </div>
    </div>
  );
}
