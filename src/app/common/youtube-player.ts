export interface YoutubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoUrl(): string;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

type PlayerEvent = { target: YoutubePlayer; data: number };
type YoutubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onReady(event: PlayerEvent): void;
        onStateChange(event: PlayerEvent): void;
        onAutoplayBlocked(event: PlayerEvent): void;
      };
    },
  ) => YoutubePlayer;
};

type YoutubeWindow = Window & {
  YT?: YoutubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

let apiPromise: Promise<YoutubeApi> | undefined;

export function loadYoutubePlayer(): Promise<YoutubeApi> {
  const host = window as YoutubeWindow;
  if (host.YT?.Player) return Promise.resolve(host.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previousReady = host.onYouTubeIframeAPIReady;
    host.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (host.YT) resolve(host.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      apiPromise = undefined;
      script.remove();
      reject(new Error("Unable to load YouTube player"));
    };
    document.head.append(script);
  });
  return apiPromise;
}
