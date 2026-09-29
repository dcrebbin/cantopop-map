import assert from "node:assert/strict";
import test from "node:test";
import { groupNearbyPoints } from "./marker-groups";

void test("groups nearby markers without chaining distant locations", () => {
  const points = [0, 30, 60, 90].map((x) => ({ x, y: 0 }));
  assert.deepEqual(
    groupNearbyPoints(points, (point) => point, 36).map(
      (group) => group.entries,
    ),
    [points.slice(0, 2), points.slice(2)],
  );
});

void test("includes the radius boundary and searches across negative grid cells", () => {
  const points = [
    { x: -1, y: 0 },
    { x: 35, y: 0 },
    { x: 35.01, y: 0 },
  ];
  assert.deepEqual(
    groupNearbyPoints(points, (point) => point, 36).map(
      (group) => group.entries,
    ),
    [points.slice(0, 2), points.slice(2)],
  );
});

void test("grid matches an exhaustive nearest-anchor search", () => {
  let seed = 12345;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const points = Array.from({ length: 3000 }, () => ({
    x: random() * 2000 - 1000,
    y: random() * 2000 - 1000,
  }));
  const expected: { entries: typeof points; x: number; y: number }[] = [];
  for (const point of points) {
    let nearest: (typeof expected)[number] | undefined;
    let distanceSquared = 36 ** 2;
    for (const group of expected) {
      const distance = (point.x - group.x) ** 2 + (point.y - group.y) ** 2;
      if (
        distance <= distanceSquared &&
        (!nearest || distance < distanceSquared)
      ) {
        nearest = group;
        distanceSquared = distance;
      }
    }
    if (nearest) nearest.entries.push(point);
    else expected.push({ entries: [point], ...point });
  }
  assert.deepEqual(
    groupNearbyPoints(points, (point) => point, 36),
    expected,
  );
});
