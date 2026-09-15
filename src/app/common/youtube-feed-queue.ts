import { youtubeVideoId } from "./youtube-video-id";
import type { YoutubePlayer } from "./youtube-player";

/** Switches tracks in the test playlist without loading discovery-feed videos. */
export class YoutubeFeedQueue {
  private selectedId: string | null = null;
  private hookTime = 0;
  private seekAfterPlaylistJump = false;

  constructor(
    private player: YoutubePlayer,
    private onCurrentVideo: (current: boolean) => void,
  ) {}

  select(feedIndex: number, hookTime: number, force = false) {
    const playlist = this.player.getPlaylist() ?? [];
    if (playlist.length === 0) {
      this.onCurrentVideo(false);
      return;
    }
    const playlistIndex =
      ((feedIndex % playlist.length) + playlist.length) % playlist.length;
    const videoId = playlist[playlistIndex] ?? null;
    if (!force && this.selectedId === videoId && this.hookTime === hookTime)
      return;
    this.selectedId = videoId;
    this.hookTime = hookTime;
    this.onCurrentVideo(false);

    // playVideoAt starts from zero; seek when the new track is actually loaded.
    this.seekAfterPlaylistJump = hookTime > 0;
    this.player.playVideoAt(playlistIndex);
  }

  stateChanged(state: number) {
    const currentId = youtubeVideoId(this.player.getVideoUrl());
    const current = currentId !== null && currentId === this.selectedId;
    this.onCurrentVideo(current);
    if (current && this.seekAfterPlaylistJump && (state === 1 || state === 5)) {
      this.seekAfterPlaylistJump = false;
      this.player.seekTo(this.hookTime, true);
    }
  }
}
