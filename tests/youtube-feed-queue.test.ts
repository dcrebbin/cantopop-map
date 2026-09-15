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
      getCurrentTime: () => 0,
      getDuration: () => 0,
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
  s.queue.select("beta1234567", 43);
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

void test("videos absent from the playlist are never loaded", () => {
  const s = setup(["alpha123456", "beta1234567"]);
  s.queue.select("outside1234", 12);
  assert.deepEqual(s.calls, []);
  assert.equal(s.visible(), false);
});

void test("quick swipes hide stale tracks and only reveal the selected video", () => {
  const s = setup(["alpha123456", "beta1234567", "gamma12345"]);
  s.queue.select("alpha123456", 0);
  s.setCurrent("alpha123456");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  s.queue.select("beta1234567", 10);
  s.queue.select("gamma12345", 20);
  assert.equal(s.visible(), false);
  s.setCurrent("beta1234567");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), false);
  s.setCurrent("gamma12345");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), false);
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  assert.deepEqual(s.calls, ["at:0", "at:1", "at:2", "seek:20"]);
});

void test("a revealed video stays on screen while paused", () => {
  const s = setup(["alpha123456"]);
  s.queue.select("alpha123456", 0);
  s.setCurrent("alpha123456");
  s.queue.stateChanged(3);
  assert.equal(s.visible(), false);
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  s.queue.stateChanged(2);
  assert.equal(s.visible(), true);
});

void test("revisiting the same video can restart its hook", () => {
  const s = setup(["alpha123456"]);
  s.queue.select("alpha123456", 18);
  s.queue.select("alpha123456", 18);
  s.queue.select("alpha123456", 18, true);
  assert.deepEqual(s.calls, ["at:0", "at:0"]);
});
