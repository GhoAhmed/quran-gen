"use client";

import { useEffect } from "react";
import { useSelectionStore } from "../lib/store/selection-store";
import { useStudioStore } from "../lib/store/studio-store";
import { PreviewCanvas } from "../components/studio/preview-canvas";
import { ReciterPanel } from "../components/studio/reciter-panel";
import { BackgroundPanel } from "../components/studio/background-panel";
import { CaptionPanel } from "../components/studio/caption-panel";
import { AspectRatioPanel } from "../components/studio/aspect-ratio-panel";
import { ExportPanel } from "../components/studio/export-panel";
import { VersesSummary } from "../components/studio/verses-summary";
import { Card } from "../components/ui/card";

export default function StudioPage() {
    const selectedVerses = useSelectionStore((s) => s.verses);
    const setStudioVerses = useStudioStore((s) => s.setVerses);
    const studioVerses = useStudioStore((s) => s.verses);

    // Sync verses chosen on the surah picker into the studio project
    useEffect(() => {
        if (selectedVerses.length) {
            setStudioVerses(selectedVerses);
        }
    }, [selectedVerses, setStudioVerses]);

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold">Studio</h1>
            <p className="text-gray-400 mt-1 text-sm">
                Customize the look, choose a reciter, and export your video.
            </p>

            <div className="mt-6">
                <VersesSummary verses={studioVerses} />
            </div>

            <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
                <div className="flex justify-center">
                    <PreviewCanvas />
                </div>

                <div className="space-y-4">
                    <Card>
                        <AspectRatioPanel />
                    </Card>
                    <Card>
                        <BackgroundPanel />
                    </Card>
                    <Card>
                        <ReciterPanel />
                    </Card>
                    <Card>
                        <CaptionPanel />
                    </Card>
                    <Card>
                        <ExportPanel />
                    </Card>
                </div>
            </div>
        </div>
    );
}