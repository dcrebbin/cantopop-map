import Image from "next/image";

export default function Appbar() {
  return (
    <div className="w-78 absolute z-[999999] flex h-14 flex-col items-center justify-start gap-2 bg-transparent">
      <h1 className="flex h-fit items-center justify-center px-3 pb-0 pt-3 text-center font-[Cute] text-5xl leading-none text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)]">
        cantopop地圖
      </h1>
      <a
        target="_blank"
        href="https://savecantonese.org"
        className="flex h-fit flex-row items-center justify-center gap-1 p-0 pb-2 text-center font-[Cute] text-2xl leading-none text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)] hover:underline"
      >
        savecantonese.org
        <Image
          width={100}
          height={100}
          src="/images/savecanto.webp"
          alt="savecanto"
          className="h-10 w-auto"
        />
      </a>
    </div>
  );
}
