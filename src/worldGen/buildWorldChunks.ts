import * as Voxels from "../voxels";
import * as VoxelFactories from "../voxelFactories";
import { chunkName } from "../chunks";

export function buildWorldChunks(
  resolution: number,
  size: number,
  createMesh: (voxels: Voxels.Voxels, chunkName: string) => void
): ArrayBuffer {
  const totalChunks = size * size * size;
  const totalVoxelsPerChunk = resolution * resolution * resolution;
  const voxelBuffer = new ArrayBuffer(totalChunks * totalVoxelsPerChunk);
  const bytesPerVoxel = 1;

  const lowerBound = 0 - (size * resolution) / 2;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const originX = lowerBound + resolution * x;
        const originY = lowerBound + resolution * y;
        const originZ = lowerBound + resolution * z;

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
          VoxelFactories.positionedTerrain(originX, originY, originZ),
          typedArray
        );

        createMesh(voxels, chunkName(x, y, z));
      }
    }
  }

  return voxelBuffer;
}
