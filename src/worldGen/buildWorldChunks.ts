import * as Voxels from "../world/voxels";
import * as VoxelFactories from "../world/voxelFactories";
import ndarray from "ndarray";
import { Heightmap } from "./heightmap";
import { Terrainmap } from "./terrain";

export function buildWorldChunks(
  resolution: number,
  size: number,
  voxelBuffer: ArrayBuffer,
  heightmap: Heightmap,
  terrainmap: Terrainmap
): ndarray<Voxels.Voxels> {
  const chunkVoxels: ndarray<Voxels.Voxels> = ndarray(
    new Array(size * size * size),
    [size, size, size]
  );

  const totalVoxelsPerChunk = resolution * resolution * resolution;
  const bytesPerVoxel = 1;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const offset =
          totalVoxelsPerChunk * x +
          totalVoxelsPerChunk * size * y +
          totalVoxelsPerChunk * size * size * z;

        const bufferOffset = offset * bytesPerVoxel;
        const bufferLength = totalVoxelsPerChunk * bytesPerVoxel;
        const typedArray = new Uint8Array(
          voxelBuffer,
          bufferOffset,
          bufferLength
        );

        const voxels = Voxels.create(
          resolution,
          VoxelFactories.fromHeightmap(
            x * resolution,
            y * resolution,
            z * resolution,
            size * resolution,
            heightmap,
            terrainmap
          ),
          typedArray
        );

        chunkVoxels.set(x, y, z, voxels as any);
      }
    }
  }

  return chunkVoxels;
}
