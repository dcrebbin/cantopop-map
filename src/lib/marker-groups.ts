/** Group around fixed anchors so nearby points cannot form one long chain. */
export function groupNearbyPoints<T>(
  items: readonly T[],
  project: (item: T) => { x: number; y: number },
  radius: number,
) {
  const groups: { entries: T[]; x: number; y: number }[] = [];
  const cells = new Map<string, number[]>();
  const radiusSquared = radius * radius;
  for (const item of items) {
    const point = project(item);
    const cellX = Math.floor(point.x / radius);
    const cellY = Math.floor(point.y / radius);
    let nearest = -1;
    let distanceSquared = radiusSquared;
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        for (const index of cells.get(`${x},${y}`) ?? []) {
          const group = groups[index]!;
          const distance = (point.x - group.x) ** 2 + (point.y - group.y) ** 2;
          if (
            distance <= distanceSquared &&
            (distance < distanceSquared || nearest < 0 || index < nearest)
          ) {
            nearest = index;
            distanceSquared = distance;
          }
        }
      }
    }
    if (nearest >= 0) {
      groups[nearest]!.entries.push(item);
    } else {
      const key = `${cellX},${cellY}`;
      const bucket = cells.get(key) ?? [];
      bucket.push(groups.length);
      cells.set(key, bucket);
      groups.push({ entries: [item], x: point.x, y: point.y });
    }
  }
  return groups;
}
