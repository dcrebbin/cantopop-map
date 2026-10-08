import assert from "node:assert/strict";
import { test } from "node:test";
import { YoutubeFeedQueue } from "../src/app/common/youtube-feed-queue";

function setup() {
  const calls: string[] = [];
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
      getVideoUrl: () =>
        currentId ? `https://www.youtube.com/watch?v=${currentId}` : "",
      loadVideoById: (id) => {
        calls.push(`load:${id}`);
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

void test("selected video loads and seeks at its hook", () => {
  const s = setup();
  s.queue.select("beta1234567", 43);
  assert.deepEqual(s.calls, ["load:beta1234567"]);
  s.setCurrent("alpha123456");
  s.queue.stateChanged(1);
  assert.equal(s.visible(), false);
  s.setCurrent("beta1234567");
  s.queue.stateChanged(1);
  s.queue.stateChanged(1);
  assert.equal(s.visible(), true);
  assert.deepEqual(s.calls, ["load:beta1234567", "seek:43"]);
});

void test("any selected discovery video can be loaded", () => {
  const s = setup();
  s.queue.select("outside1234", 12);
  assert.deepEqual(s.calls, ["load:outside1234"]);
  assert.equal(s.visible(), false);
});

void test("quick swipes hide stale tracks and only reveal the selected video", () => {
  const s = setup();
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
  assert.deepEqual(s.calls, ["load:alpha123456", "load:beta1234567", "load:gamma12345", "seek:20"]);
});

void test("a revealed video stays on screen while paused", () => {
  const s = setup();
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
  const s = setup();
  s.queue.select("alpha123456", 18);
  s.queue.select("alpha123456", 18);
  s.queue.select("alpha123456", 18, true);
  assert.deepEqual(s.calls, ["load:alpha123456", "load:alpha123456"]);
});
