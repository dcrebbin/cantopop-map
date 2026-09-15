import assert from "node:assert/strict";
import { test } from "node:test";
import { YoutubeFeedQueue } from "../src/app/common/youtube-feed-queue";

function setup(initialPlaylist: string[]) {
  const calls: string[] = [];
  const playlist = initialPlaylist;
  let currentId = "";
  let visible = false;
  const queue = new YoutubeFeedQueue(
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
      getPlaylist: () => playlist,
      getVideoUrl: () =>
        currentId ? `https://www.youtube.com/watch?v=${currentId}` : "",
      playVideoAt: (index) => {
        calls.push(`at:${index}`);
      },
      destroy: () => {
        calls.push("destroy");
      },
    },
    (value) => {
      visible = value;
    },
  );
  return {
    queue,
    calls,
    setCurrent: (id: string) => {
      currentId = id;
    },
    visible: () => visible,
  };
}

void test("playlist track jumps within one player and seeks at its hook", () => {
  const s = setup(["alpha123456", "beta1234567"]);
  s.queue.select(1, 43);
  assert.deepEqual(s.calls, ["at:1"]);
  s.setCurrent("alpha123456");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), false);
  s.setCurrent("beta1234567");
  s.queue.stateChanged(1);
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  assert.deepEqual(s.calls, ["at:1", "seek:43"]);
});

void test("feed positions wrap through the test playlist only", () => {
  const s = setup(["alpha123456", "beta1234567"]);
  s.queue.select(5, 12);
  assert.deepEqual(s.calls, ["at:1"]);
  s.setCurrent("beta1234567");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  assert.deepEqual(s.calls, ["at:1", "seek:12"]);
});

void test("quick swipes hide stale tracks and only reveal the selected video", () => {
  const s = setup(["alpha123456", "beta1234567", "gamma12345"]);
  s.queue.select(0, 0);
  s.setCurrent("alpha123456");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  s.queue.select(1, 10);
  s.queue.select(2, 20);
  assert.equal(s.visible(), false);
  s.setCurrent("beta1234567");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), false);
  s.setCurrent("gamma12345");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  assert.deepEqual(s.calls, ["at:0", "at:1", "at:2", "seek:20"]);
});

void test("revisiting the same video can restart its hook", () => {
  const s = setup(["alpha123456"]);
  s.queue.select(0, 18);
  s.queue.select(0, 18);
  s.queue.select(0, 18, true);
  assert.deepEqual(s.calls, ["at:0", "at:0"]);
});
