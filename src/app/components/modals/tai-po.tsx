import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useUIStore } from "~/app/_state/ui.store";

export default function TaiPoModal() {
  const { taiPoModalHasSeen, setTaiPoModalHasSeen } = useUIStore();
  function getHasSeenFromLocalStorage() {
    const hasSeen = localStorage.getItem("taiPoModalHasSeen");
    return hasSeen === "true";
  }

  useEffect(() => {
    if (getHasSeenFromLocalStorage()) {
      setTaiPoModalHasSeen(true);
    } else {
      setTaiPoModalHasSeen(false);
    }
  }, []);

  if (taiPoModalHasSeen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 text-white">
      <div className="mx-4 flex h-fit w-[50rem] flex-col items-center justify-start rounded-lg bg-black p-4">
        <div className="flex w-full flex-row items-start justify-between">
          <h1>Tai Po Fire Resources | 大埔消防資源</h1>
          <button
            type="button"
            onClick={() => {
              setTaiPoModalHasSeen(true);
              localStorage.setItem("taiPoModalHasSeen", "true");
            }}
          >
            Close
          </button>
        </div>
        <hr className="my-1 w-full" />
        <p className="text-sm">
          A devastating fire has affected Tai Po. Please check out the following
          resources to help the community.
        </p>
        <p className="text-sm">
          一個嚴重火災影響大埔。請查看以下資源，幫助社區走出困境。
        </p>
        <hr className="my-1 w-full" />
        <div className="flex w-full flex-col items-center justify-start gap-2">
          <div className="flex w-full flex-row items-center justify-start gap-2">
            <p>宏福苑報平安 | Hong Fuk Court Safety Check</p>
            <a
              href="https://taipo-fire.web.app/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline"
            >
              taipo-fire.web.app
            </a>
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <h2 className="w-full border-b border-white pb-2 text-center font-semibold">
              Community Support | 社區支援
            </h2>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>賽馬會大埔綜合青少年服務中心</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 2653 8514
                <a href="https://maps.app.goo.gl/wYqkkAmwpHi7ZwEZA">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>新界大埔廣福邨廣仁樓220-229室 賽馬會太和中心</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 2654 6066
                <a href="https://share.google/Eu6wXI0BxFvkrOh0D">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>太和邨第11座福和樓 新界傷健中心</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" />
                2638 9011
                <a href="https://share.google/e5yVWTp3ooHZiHC5G">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>
                大埔廣宏街110-115號廣福邨廣平樓號地下 中華基督教會馮梁結紀念中學
              </p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 2651 6033
                <a href="https://share.google/n9mCAllR7Cr6Qpwl8">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>大埔寶湖道22號 廣福社區會堂</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 2657 2948
                <a href="https://share.google/oSmLAOVjIeOjLtBnV">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>東昌街社區會堂</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 2253 1637
                <a href="https://share.google/cMUWIoeIQyzQchnxd">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>宣道會大埔堂 - 趙牧師</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 9746 8710
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>大埔廣福道152-172號大埔商業中心十三樓 銘恩中心教會 - 陳牧師</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 9443 3733
                <a href="https://maps.app.goo.gl/bY3NPRkCeRRZiDwn7">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                </a>
              </p>
            </div>
            <div className="flex w-full flex-row items-center justify-start gap-2 border-b border-white pb-2">
              <p>大元邨多層停車場地下 香港寵物會寵物救護團隊救護車 1</p>
              <p className="flex flex-row items-center justify-start gap-2 font-bold">
                <PhoneIcon className="h-4 w-4" /> 5481 4646
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
