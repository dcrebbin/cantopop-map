import assert from "node:assert/strict";
import { test } from "node:test";
import { YoutubePlayback } from "../src/app/common/youtube-playback";

function setup(hookTime = 0) {
  const calls: string[] = [];
  let playing = false;
  let blocked = false;
  const playback = new YoutubePlayback(
    {
      playVideo: () => {
        calls.push("play");
      },
      pauseVideo: () => {
        calls.push("pause");
      },
      mute: () => {
        calls.push("mute");
      },
      unMute: () => {
        calls.push("unmute");
      },
      seekTo: (seconds) => {
        calls.push(`seek:${seconds}`);
      },
      getPlaylist: () => [],
      getVideoUrl: () => "",
      playVideoAt: () => { calls.push("at"); },
      loadPlaylist: () => { calls.push("load"); },
      destroy: () => {
        calls.push("destroy");
      },
    },
    (value) => {
      playing = value;
    },
    (value) => {
      blocked = value;
    },
    hookTime,
  );
  return { playback, calls, playing: () => playing, blocked: () => blocked };
}
const audible = { active: true, muted: false, paused: false };

void test("audible autoplay falls back once and does not retry sound on PLAYING", () => {
  const s = setup();
  s.playback.sync(audible);
  assert.deepEqual(s.calls, ["unmute", "play"]);
  s.playback.autoplayBlocked();
  s.playback.stateChanged(1);
  assert.equal(s.blocked(), true);
  assert.equal(s.playing(), true);
  assert.deepEqual(s.calls, ["unmute", "play", "mute", "play"]);
  s.playback.autoplayBlocked();
  assert.equal(s.calls.length, 4);
  assert.equal(s.playing(), false);
});

void test("gesture sends unmute and play; the subsequent React sync is a no-op", () => {
  const s = setup();
  s.playback.sync(audible);
  s.playback.autoplayBlocked();
  s.calls.length = 0;
  s.playback.retrySound();
  s.playback.sync({ ...audible });
  assert.deepEqual(s.calls, ["unmute", "play"]);
  assert.equal(s.blocked(), false);
});

void test("explicit mute survives retries and navigation", () => {
  const s = setup();
  const muted = { ...audible, muted: true };
  s.playback.sync(muted, true);
  s.playback.autoplayBlocked();
  s.calls.length = 0;
  s.playback.retrySound();
  assert.deepEqual(s.calls, []);
  s.playback.sync({ ...muted, active: false });
  s.playback.sync(muted);
  assert.deepEqual(s.calls, ["mute", "pause", "mute", "play"]);
});

void test("late events cannot restart an inactive video", () => {
  const s = setup();
  s.playback.sync(audible);
  s.playback.sync({ ...audible, active: false });
  s.calls.length = 0;
  s.playback.stateChanged(1);
  s.playback.autoplayBlocked();
  s.playback.retrySound();
  assert.deepEqual(s.calls, ["mute", "pause"]);
  assert.equal(s.playing(), false);
});

void test("paused video stays paused; a resume gesture requests sound", () => {
  const s = setup();
  s.playback.sync(audible);
  s.playback.sync({ ...audible, paused: true }, true);
  s.calls.length = 0;
  s.playback.stateChanged(3);
  s.playback.autoplayBlocked();
  s.playback.retrySound();
  assert.deepEqual(s.calls, ["pause"]);
  s.playback.sync(audible, true);
  assert.deepEqual(s.calls, ["pause", "unmute", "play"]);
});

void test("only active, unpaused videos loop", () => {
  const s = setup();
  s.playback.sync(audible);
  s.calls.length = 0;
  s.playback.stateChanged(0);
  assert.deepEqual(s.calls, ["seek:0", "play"]);
  s.playback.sync({ ...audible, active: false });
  s.calls.length = 0;
  s.playback.stateChanged(0);
  assert.deepEqual(s.calls, ["mute"]);
});

void test("finished videos loop from their hook time", () => {
  const s = setup(42);
  s.playback.sync(audible);
  s.calls.length = 0;
  s.playback.stateChanged(0);
  assert.deepEqual(s.calls, ["seek:42", "play"]);
});
