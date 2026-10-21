export function canStandAt(x, z, obstacles, bounds, radius = .24) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) return false;
  return !obstacles.some(b => x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ);
}
