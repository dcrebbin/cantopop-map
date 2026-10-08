"use client";

import { useMemo, useState } from "react";
import { quantizeSrtContent } from "~/lib/srt/quantize";

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getQuantizedFilename(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return `${filename}.quantized.srt`;
  const base = filename.slice(0, dotIndex);
  const extension = filename.slice(dotIndex);
  return `${base}.quantized${extension}`;
}

export default function SrtQuantizePage() {
  const [fps, setFps] = useState("25");
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedFps = Number.parseFloat(fps);

  const result = useMemo(() => {
    if (originalContent === null) return null;
    if (!Number.isFinite(parsedFps) || parsedFps <= 0) return null;

    try {
      return quantizeSrtContent(originalContent, parsedFps);
    } catch {
      return null;
    }
  }, [originalContent, parsedFps]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Could not read the selected file.");
        setOriginalContent(null);
        return;
      }
      setOriginalContent(reader.result);
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
      setOriginalContent(null);
    };
    reader.readAsText(file);
  }

  function handleDownload() {
    if (!result || !fileName) return;
    downloadText(result.content, getQuantizedFilename(fileName));
  }

  const fpsError =
    fps.trim().length > 0 && (!Number.isFinite(parsedFps) || parsedFps <= 0)
      ? "Enter a valid FPS greater than 0."
      : null;

  return (
    <div className="fixed top-0 left-0 z-[-2] flex max-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-transparent">
      <main className="relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-[95%] max-w-3xl flex-col gap-5 rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg sm:p-6 lg:w-full">
        <div>
          <h1 className="font-serif text-3xl font-bold">SRT Frame Quantizer</h1>
          <p className="mt-2 text-sm text-white/75">
            Upload an SRT subtitle file and snap cue timestamps to frame
            boundaries using your video FPS.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-3 rounded-lg border border-white/20 bg-black/20 p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span>FPS</span>
            <input
              type="number"
              min="0.01"
              step="0.001"
              value={fps}
              onChange={(event) => setFps(event.target.value)}
              aria-label="Frames per second"
              className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm ring-white/40 outline-none placeholder:text-white/50 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>SRT file</span>
            <input
              type="file"
              accept=".srt,text/plain"
              onChange={handleFileChange}
              aria-label="Upload SRT file"
              className="rounded-md border border-white/30 bg-black/40 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/15 file:px-3 file:py-1 file:text-sm file:text-white hover:file:bg-white/25"
            />
          </label>
        </section>

        {(fpsError ?? error) && (
          <p className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {fpsError ?? error}
          </p>
        )}

        <section className="rounded-lg border border-white/20 bg-black/20 p-4 text-sm text-white/80">
          {!fileName ? (
            <p>Select an SRT file to preview quantization results.</p>
          ) : result ? (
            <div className="flex flex-col gap-2">
              <p>
                <span className="text-white/60">File:</span> {fileName}
              </p>
              <p>
                <span className="text-white/60">FPS:</span> {parsedFps}
              </p>
              <p>
                <span className="text-white/60">Frame duration:</span>{" "}
                {(1000 / parsedFps).toFixed(3)} ms
              </p>
              <p>
                <span className="text-white/60">Adjusted cues:</span>{" "}
                {result.adjustedCueCount} / {result.totalCueCount}
              </p>
            </div>
          ) : (
            <p>Unable to quantize this file with the current FPS.</p>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!result || Boolean(fpsError)}
            onClick={handleDownload}
            className="rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/50"
          >
            Download quantized SRT
          </button>
          <a
            href="/"
            className="rounded-md border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Back to map
          </a>
        </div>
      </main>
      <div className="fixed top-0 left-0 z-[-2] h-screen w-screen bg-[url('/images/hk.jpg')] bg-cover bg-center blur-sm" />
    </div>
  );
}
