/* eslint-disable no-alert */
"use client";

import { CameraErrorOverlay } from "./camera-error-overlay";
import { CameraPermissionGate } from "./camera-permission-gate";
import { LocationMarker } from "./location-marker";
import { useMobileCameraView } from "./use-mobile-camera-view";

export default function MobileCameraView() {
  const {
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
  } = useMobileCameraView();

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
        {sortedAnnotations.map((entry, index) => (
          <LocationMarker
            key={entry.location.id}
            entry={entry}
            stackIndex={index}
            stackSize={sortedAnnotations.length}
          />
        ))}
      </div>

      {needsPermissionGate ? (
        <CameraPermissionGate
          setupInProgress={setupInProgress}
          cameraPermission={cameraPermission}
          locationPermission={locationPermission}
          orientationPermission={orientationPermission}
          requiresOrientationPermission={requiresOrientationPermission}
          dispatch={dispatch}
          onRequestPermissions={requestAllPermissions}
        />
      ) : null}

      {showOverlayMessage ? (
        <CameraErrorOverlay
          cameraError={cameraError}
          locationError={locationError}
          orientationError={orientationError}
        />
      ) : null}
    </div>
  );
}
