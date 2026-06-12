import type { AnnotatedLocation } from "./utils";

export function LocationMarker({
  entry,
  stackIndex,
  stackSize,
}: {
  entry: AnnotatedLocation;
  stackIndex: number;
  stackSize: number;
}) {
  return (
    <div
      className="absolute relative flex h-28 w-48 flex-col items-center overflow-hidden rounded-xl border border-white/40 bg-black/50 text-center text-white backdrop-blur-lg"
      style={{
        left: `calc(${entry.horizontalPercent}% - 6rem)`,
        top: `${entry.verticalPercent}%`,
        zIndex: stackSize - stackIndex,
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
