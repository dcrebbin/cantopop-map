import { useEffect } from "react";
import { useMapStore } from "../_state/map.store";

const reactScanEnabled = import.meta.env.VITE_REACT_SCAN === "true";

export default function ReactScan() {
  const markerStats = useMapStore((state) => state.markerDebugStats);

  useEffect(() => {
    if (!reactScanEnabled || typeof window === "undefined") {
      return;
    }

    void import("react-scan").then(({ scan }) => {
      scan({ enabled: true, showToolbar: true, log: false });
    });
  }, []);

  if (!reactScanEnabled) return null;

  return (
    <aside className="fixed right-3 bottom-3 z-[9999] min-w-56 rounded-md bg-black/85 p-3 font-mono text-xs text-white shadow-lg backdrop-blur-sm">
      <div className="mb-2 font-semibold text-lime-300">Marker debug</div>
      {markerStats ? (
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt>Total locations</dt>
          <dd>{markerStats.totalLocations}</dd>
          <dt>After filters</dt>
          <dd>{markerStats.filteredLocations}</dd>
          <dt>Standalone markers</dt>
          <dd>{markerStats.standaloneMarkers}</dd>
          <dt>Cluster bubbles</dt>
          <dd>{markerStats.clusterMarkers}</dd>
          <dt>Inside clusters</dt>
          <dd>{markerStats.clusteredLocations}</dd>
          <dt className="font-semibold text-lime-300">Rendered symbols</dt>
          <dd className="font-semibold text-lime-300">
            {markerStats.renderedMarkers}
          </dd>
          <dt>Map zoom</dt>
          <dd>{markerStats.zoom.toFixed(2)}</dd>
        </dl>
      ) : (
        <p className="text-white/70">Waiting for map markers…</p>
      )}
    </aside>
  );
}
