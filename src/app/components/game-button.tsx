import { gamepadIcon } from "~/lib/icons/gamepadIcon";
import { SvgIcon } from "./map/PopupContent";
import { useUIStore } from "../_state/ui.store";

export default function GameButton() {
  const { setGameOpen, gameOpen } = useUIStore();
  return (
    <button
      type="button"
      className="z-[100] cursor-pointer"
      onClick={() => setGameOpen(!gameOpen)}
    >
      <SvgIcon
        html={gamepadIcon}
        className="h-6 w-6 text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)]"
      />{" "}
    </button>
  );
}
