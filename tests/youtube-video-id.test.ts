import assert from "node:assert/strict";
import { test } from "node:test";
import { youtubeVideoId } from "../src/app/common/youtube-video-id";

void test("extracts YouTube video IDs without timestamps", () => {
  assert.equal(youtubeVideoId("https://youtu.be/xNjkUL8j564?t=75"), "xNjkUL8j564");
  assert.equal(
    youtubeVideoId("https://www.youtube.com/watch?v=xNjkUL8j564&t=75"),
    "xNjkUL8j564",
  );
  assert.equal(youtubeVideoId("https://youtube.com/shorts/xNjkUL8j564"), "xNjkUL8j564");
  assert.equal(youtubeVideoId("https://example.com/watch?v=xNjkUL8j564"), null);
});
