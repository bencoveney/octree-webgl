import ndarray from "ndarray";
import { Voxel } from "./voxel";

export type Voxels = ndarray<Voxel>;

export type VoxelFactory = (
  x: number,
  y: number,
  z: number,
  size: number,
  halfSize: number
) => Voxel;

export function create(
  size: number,
  factory: VoxelFactory,
  buffer: Uint8Array
): Voxels {
  const result = ndarray<Voxel>(buffer, [size, size, size]);

  const halfSize = size / 2;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        result.set(x, y, z, factory(x, y, z, size, halfSize) as any);
      }
    }
  }

  return result;
}
