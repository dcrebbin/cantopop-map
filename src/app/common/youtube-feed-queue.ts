import { youtubeVideoId } from "./youtube-video-id";
import type { YoutubePlayer } from "./youtube-player";

/** Loads the selected discovery video and only reveals its matching frames. */
export class YoutubeFeedQueue {
  private selectedId: string | null = null;
  private hookTime = 0;
  private seekAfterLoad = false;
  private revealed = false;

  constructor(
    private player: YoutubePlayer,
    private onCurrentVideo: (current: boolean) => void,
  ) {}

  select(videoId: string, hookTime: number, force = false) {
    if (!force && this.selectedId === videoId && this.hookTime === hookTime)
      return;
    this.selectedId = videoId;
    this.hookTime = hookTime;
    this.revealed = false;
    this.onCurrentVideo(false);

    // Loading starts from zero; seek when the new video is actually loaded.
    this.seekAfterLoad = hookTime > 0;
    this.player.loadVideoById(videoId);
  }

  stateChanged(state: number) {
    const currentId = youtubeVideoId(this.player.getVideoUrl());
    if (currentId === null || currentId !== this.selectedId) {
      this.revealed = false;
      this.onCurrentVideo(false);
      return;
    }
    if (this.seekAfterLoad && (state === 1 || state === 5)) {
      this.seekAfterLoad = false;
      this.onCurrentVideo(false);
      this.player.seekTo(this.hookTime, true);
      return;
    }
    // Loading a video and seeking to its hook can paint frames from the wrong
    // moment, so stay behind the thumbnail until the track is really playing.
    // Once revealed it stays revealed, otherwise pausing would hide the video.
    if (!this.revealed) {
      if (state !== 1) {
        this.onCurrentVideo(false);
        return;
      }
      this.revealed = true;
    }
    this.onCurrentVideo(true);
  }
}
