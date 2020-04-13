import ndarray from "ndarray";
import { forEach2d } from "../utils";
import { perlin2 } from "simplenoise";

export type Heightmap = ndarray<number>;

export function createHeightmap(size: number): Heightmap {
  const heightmap = new Float32Array(size * size);
  const wrapper = ndarray(heightmap, [size, size]);
  return wrapper;
}

export type Octave = {
  step: number;
  amplitude: number;
};

export function populateHeightmap(
  heightmap: Heightmap,
  octaves: Octave[]
): void {
  forEach2d(heightmap, (_, x, y) => {
    let height = 1;
    for (const { step, amplitude } of octaves) {
      height += perlin2(x / step, y / step) * amplitude;
    }
    heightmap.set(x, y, height);
  });
}

export function normalizeHeightmap(heightmap: Heightmap) {
  let minValue = Number.MAX_SAFE_INTEGER;
  let maxValue = Number.MIN_SAFE_INTEGER;

  forEach2d(heightmap, (value) => {
    minValue = Math.min(value, minValue);
    maxValue = Math.max(value, maxValue);
  });

  forEach2d(heightmap, (value, x, y) => {
    heightmap.set(x, y, (value - minValue) / (maxValue - minValue));
  });
}

export function scaleHeightmap(heightmap: Heightmap, amount: number) {
  forEach2d(heightmap, (value, x, y) => {
    heightmap.set(x, y, value * amount);
  });
}

export function heightmapToString(heightmap: Heightmap): string {
  let result = "";
  forEach2d(heightmap, (height, _x, y) => {
    result += `${Math.floor(height)},`.padStart(4);
    if (y === heightmap.shape[0] - 1) {
      result += "\n";
    }
  });
  return result;
}
