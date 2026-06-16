import Link from "next/link";
import { BookOpenText, Clapperboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-[#0a0f1c]/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <BookOpenText className="size-5 text-emerald-400" />
          <span>Quran Studio</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/surahs"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Surahs
          </Link>
          <Link
            href="/studio"
            className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Clapperboard className="size-4" />
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
