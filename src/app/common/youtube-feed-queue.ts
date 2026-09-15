import { youtubeVideoId } from "./youtube-video-id";
import type { YoutubePlayer } from "./youtube-player";

/** Switches tracks in the test playlist without loading discovery-feed videos. */
export class YoutubeFeedQueue {
  private selectedId: string | null = null;
  private hookTime = 0;
  private seekAfterPlaylistJump = false;
  private revealed = false;

  constructor(
    private player: YoutubePlayer,
    private onCurrentVideo: (current: boolean) => void,
  ) {}

  select(videoId: string, hookTime: number, force = false) {
    const playlist = this.player.getPlaylist() ?? [];
    const playlistIndex = playlist.indexOf(videoId);
    if (playlistIndex < 0) {
      this.onCurrentVideo(false);
      return;
    }
    if (!force && this.selectedId === videoId && this.hookTime === hookTime)
      return;
    this.selectedId = videoId;
    this.hookTime = hookTime;
    this.revealed = false;
    this.onCurrentVideo(false);

    // playVideoAt starts from zero; seek when the new track is actually loaded.
    this.seekAfterPlaylistJump = hookTime > 0;
    this.player.playVideoAt(playlistIndex);
  }

  stateChanged(state: number) {
    const currentId = youtubeVideoId(this.player.getVideoUrl());
    if (currentId === null || currentId !== this.selectedId) {
      this.revealed = false;
      this.onCurrentVideo(false);
      return;
    }
    if (this.seekAfterPlaylistJump && (state === 1 || state === 5)) {
      this.seekAfterPlaylistJump = false;
      this.onCurrentVideo(false);
      this.player.seekTo(this.hookTime, true);
      return;
    }
    // The playlist jump and the hook seek both paint frames from the wrong
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
