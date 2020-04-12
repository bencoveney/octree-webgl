import ndarray from "ndarray";
import { Voxel } from "../voxel";
import { Chunks, Chunk, chunkName } from "../chunks";

// Create friendlier chunk objects from buffer received from worker.
export function reconstructWorld(
  resolution: number,
  size: number,
  voxelBuffer: ArrayBuffer
): Chunks {
  const totalChunks = size * size * size;
  const chunks = new Array(totalChunks);
  const chunksNdarray = ndarray<Chunk>(chunks, [size, size, size]);

  const totalVoxelsPerChunk = resolution * resolution * resolution;

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
        const voxels = ndarray<Voxel>(typedArray, [
          resolution,
          resolution,
          resolution,
        ]);

        const chunk: Chunk = {
          voxels,
          originX,
          originY,
          originZ,
          size: resolution,
          name: chunkName(x, y, z),
        };

        chunksNdarray.set(x, y, z, chunk as any);
      }
    }
  }

  return chunksNdarray;
}
