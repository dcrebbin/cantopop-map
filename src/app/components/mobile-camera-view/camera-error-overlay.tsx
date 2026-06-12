type CameraErrorOverlayProps = {
  cameraError: string | null;
  locationError: string | null;
  orientationError: string | null;
};

export function CameraErrorOverlay({
  cameraError,
  locationError,
  orientationError,
}: CameraErrorOverlayProps) {
  return (
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
  );
}
