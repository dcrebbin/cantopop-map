"use client";

import { useEffect, useState } from "react";
import type { LocationItem } from "../common/locations";

function HomePageFallback() {
  return (
    <div className="full-height flex w-screen flex-col overflow-hidden">
      <div className="relative flex w-[100vw] justify-center overflow-hidden">
        <div className="map-container relative bg-[#e8eaed]" />
      </div>
    </div>
  );
}

export default function DynamicHomePage({
  location,
}: {
  location?: LocationItem;
}) {
  const [HomePage, setHomePage] = useState<React.ComponentType<{
    location?: LocationItem;
  }> | null>(null);

  useEffect(() => {
    void import("./home-page").then((mod) => {
      setHomePage(() => mod.default);
    });
  }, []);

  if (!HomePage) return <HomePageFallback />;
  return <HomePage location={location} />;
}
