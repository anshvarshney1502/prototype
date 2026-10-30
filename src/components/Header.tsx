import Link from "next/link";

export default function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-[18px] tracking-tight">
          <span className="grid place-items-center w-7 h-7 rounded-[8px] bg-teal text-white text-[14px]" aria-hidden>M</span>
          Munshi
        </Link>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
