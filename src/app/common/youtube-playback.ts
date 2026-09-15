import type { YoutubePlayer } from "./youtube-player";

type PlaybackIntent = { active: boolean; muted: boolean; paused: boolean };

/** Keeps browser autoplay fallback separate from the listener's sound preference. */
export class YoutubePlayback {
  private intent: PlaybackIntent = {
    active: false,
    muted: false,
    paused: false,
  };
  private blocked = false;
  private retriedMuted = false;

  constructor(
    private player: YoutubePlayer,
    private onPlaying: (playing: boolean) => void,
    private onSoundBlocked: (blocked: boolean) => void,
  ) {}

  sync(next: PlaybackIntent, userGesture = false) {
    const previous = this.intent;
    this.intent = next;
    if (!next.active) {
      this.player.mute();
      this.player.pauseVideo();
      this.onPlaying(false);
      return;
    }
    const starting = !previous.active || (previous.paused && !next.paused);
    const soundChanged = previous.muted !== next.muted;
    // React's update after a click must not undo the commands sent by that click.
    if (
      !starting &&
      !soundChanged &&
      previous.paused === next.paused &&
      !userGesture
    )
      return;
    if (starting || soundChanged || userGesture) {
      this.blocked = false;
      this.retriedMuted = false;
      this.onSoundBlocked(false);
    }
    if (next.muted || this.blocked) this.player.mute();
    else this.player.unMute();
    if (next.paused) this.player.pauseVideo();
    else this.player.playVideo();
  }

  retrySound() {
    if (
      this.blocked &&
      this.intent.active &&
      !this.intent.paused &&
      !this.intent.muted
    ) {
      this.sync(this.intent, true);
    }
  }

  stateChanged(state: number) {
    const { active, paused } = this.intent;
    if (!active || paused) {
      if (!active) this.player.mute();
      if (state === 1 || state === 3) this.player.pauseVideo();
      this.onPlaying(false);
      return;
    }
    this.onPlaying(state === 1);
    if (state === 0) {
      this.player.seekTo(0, true);
      this.player.playVideo();
    }
  }

  autoplayBlocked() {
    this.onPlaying(false);
    if (!this.intent.active || this.intent.paused) return;
    this.blocked = true;
    this.onSoundBlocked(!this.intent.muted);
    // Some devices block even muted autoplay. Leave the play button available
    // instead of repeatedly issuing play commands in response to rejection.
    if (this.retriedMuted) return;
    this.retriedMuted = true;
    this.player.mute();
    this.player.playVideo();
  }
}
