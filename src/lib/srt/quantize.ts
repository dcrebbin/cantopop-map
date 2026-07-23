const SRT_TIMESTAMP_REGEX = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;
const SRT_TIME_LINE_REGEX =
  /^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})(.*)$/;

export function parseSrtTimestamp(timestamp: string): number {
  const match = SRT_TIMESTAMP_REGEX.exec(timestamp.trim());
  if (!match) {
    throw new Error(`Invalid SRT timestamp: ${timestamp}`);
  }

  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    Number(millis)
  );
}

export function formatSrtTimestamp(ms: number): string {
  const clamped = Math.max(0, Math.round(ms));
  const hours = Math.floor(clamped / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1_000);
  const millis = clamped % 1_000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function quantizeMilliseconds(ms: number, fps: number): number {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("FPS must be a number greater than 0");
  }

  const frameMs = 1000 / fps;
  return Math.round(Math.round(ms / frameMs) * frameMs);
}

export interface QuantizeSrtResult {
  content: string;
  adjustedCueCount: number;
  totalCueCount: number;
}

export function quantizeSrtContent(content: string, fps: number): QuantizeSrtResult {
  const lines = content.split(/\r?\n/);
  let adjustedCueCount = 0;
  let totalCueCount = 0;

  const quantizedLines = lines.map((line) => {
    const match = SRT_TIME_LINE_REGEX.exec(line);
    if (!match) return line;

    totalCueCount += 1;
    const [, start, end, suffix = ""] = match;
    const startMs = parseSrtTimestamp(start);
    const endMs = parseSrtTimestamp(end);
    const quantizedStartMs = quantizeMilliseconds(startMs, fps);
    let quantizedEndMs = quantizeMilliseconds(endMs, fps);

    if (quantizedEndMs < quantizedStartMs) {
      quantizedEndMs = quantizedStartMs;
    }

    if (quantizedStartMs !== startMs || quantizedEndMs !== endMs) {
      adjustedCueCount += 1;
    }

    return `${formatSrtTimestamp(quantizedStartMs)} --> ${formatSrtTimestamp(quantizedEndMs)}${suffix}`;
  });

  return {
    content: quantizedLines.join("\n"),
    adjustedCueCount,
    totalCueCount,
  };
}
