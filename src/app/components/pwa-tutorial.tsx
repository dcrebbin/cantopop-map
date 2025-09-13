import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useUIStore } from "../_state/ui.store";

export default function PwaTutorial() {
  const { isPwaTutorialVisible, setIsPwaTutorialVisible } = useUIStore();

  if (!isPwaTutorialVisible) return null;
  return (
    <button
      type="button"
      name="PWA Tutorial Toggle"
      className="fixed top-0 z-[200] h-full w-full bg-black/80 backdrop-blur-sm"
      onClick={() => {
        setIsPwaTutorialVisible(false);
      }}
    >
      <div className="fixed right-0 top-0 z-[60] m-4 flex h-fit w-80 flex-col items-center rounded-lg bg-white p-2 text-black drop-shadow-lg">
        <h2 className="text-center font-sans text-xl">
          Cantopop地圖 has PWA support!
        </h2>
        <div>
          <div className="flex">
            <p>
              <b>{"1)"}</b> Click the share button on the far top right
            </p>
            <div className="flex flex-col items-center">
              <ArrowUpOnSquareIcon className="h-8 w-8"></ArrowUpOnSquareIcon>
              example
            </div>
          </div>
          <p>
            <b>{"2)"}</b> Scroll down until you see{" "}
            <i>&quot;Add to Home Screen&quot;</i>
          </p>
          <p>
            <b>{"3)"}</b> Add it
          </p>
          <p>
            <b>{"4)"}</b> It will now be available on your Home Screen{" "}
            <b>{":^)"}</b>
          </p>
          <div className="flex w-full justify-end">
            <button
              type="button"
              name="Close PWA Tutorial"
              className="rounded-lg bg-black p-1 font-bold text-white"
              onClick={() => {
                setIsPwaTutorialVisible(false);
              }}
            >
              <XMarkIcon className="h-8 w-8"></XMarkIcon>
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}
