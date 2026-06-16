import Link from "next/link";
import { ArrowRight, AudioLines, Captions, Download } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block text-xs font-medium tracking-wide uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          Free & open recitation studio
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">
          Turn Qur&apos;an verses into{" "}
          <span className="text-emerald-400">shareable videos</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Pick a surah, choose your verses, select a reciter, customize the
          background and captions, then export and download — all in your
          browser.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/surahs">
            <Button size="lg">
              Start creating <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid sm:grid-cols-3 gap-4">
        <Card>
          <AudioLines className="size-5 text-emerald-400" />
          <h3 className="mt-3 font-semibold">Choose your reciter</h3>
          <p className="mt-1.5 text-sm text-gray-400">
            Recitations from well-known reciters, synced automatically to
            your verse selection.
          </p>
        </Card>
        <Card>
          <Captions className="size-5 text-emerald-400" />
          <h3 className="mt-3 font-semibold">Custom captions</h3>
          <p className="mt-1.5 text-sm text-gray-400">
            Arabic text with translation, styled fonts, colors, and
            highlight-as-you-recite timing.
          </p>
        </Card>
        <Card>
          <Download className="size-5 text-emerald-400" />
          <h3 className="mt-3 font-semibold">Export & download</h3>
          <p className="mt-1.5 text-sm text-gray-400">
            Render directly in your browser to MP4/WebM in 9:16, 1:1, or
            16:9 — no upload required.
          </p>
        </Card>
      </div>
    </div>
  );
}