"use client";
import { closeIcon } from "~/lib/icons/closeIcon";
import { SvgIcon } from "./map/PopupContent";

function handleCloseLocationModal() {
  window.history.pushState({}, "", "/");
  const locationModal = document.getElementById("location-modal");
  const closeLocationModal = document.getElementById("close-location-modal");
  locationModal?.classList.add("hidden");
  closeLocationModal?.classList.add("hidden");
}

export default function CloseButton() {
  return (
    <button
      id="close-location-modal"
      type="button"
      onClick={handleCloseLocationModal}
    >
      <SvgIcon html={closeIcon} className="size-6 text-black" />
    </button>
  );
}
