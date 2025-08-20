export default function Footer() {
  return (
    <div className="absolute bottom-0 z-[999999] flex h-14 w-full items-center justify-center bg-transparent">
      <a
        href="https://github.com/dcrebbin/cantopop-map/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-0 p-3 font-[Cute] text-xl text-white underline drop-shadow-[0_0_4px_rgba(0,0,0,1)]"
      >
        Request locations here
      </a>
    </div>
  );
}
