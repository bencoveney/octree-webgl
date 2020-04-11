import ndarray from "ndarray";
import * as Voxels from "./voxels";
import * as VoxelFactories from "./voxelFactories";
import * as SceneGraph from "./sceneGraph";
import * as Position from "./position";
import { vec3 } from "gl-matrix";
import { forEach3d } from "./utils";
import { Voxel } from "./voxel";

export type Chunks = ndarray<Chunk>;
export type Chunk = {
  voxels: Voxels.Voxels;
  // Lowest point in each dimension.
  originX: number;
  originY: number;
  originZ: number;
  // Unique identifier per chunk. Useful for looking up models.
  name: string;
  // Size (voxels.shape[0]).
  size: number;
};

export function createChunkVoxels(
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

function chunkName(x: number, y: number, z: number): string {
  return `chunk_${x}_${y}_${z}`;
}

export function createChunks(
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

        chunksNdarray.set(x, y, z, ({
          voxels,
          originX,
          originY,
          originZ,
          size: resolution,
          name: `chunk_${x}_${y}_${z}`,
        } as Chunk) as any);
      }
    }
  }

  return chunksNdarray;
}

export function addToWorld(
  chunks: Chunks,
  sceneGraph: SceneGraph.SceneGraphNode
): void {
  const chunksSceneGraph = SceneGraph.addChild(
    sceneGraph,
    Position.init(),
    null
  );
  forEach3d(chunks, (chunk) =>
    SceneGraph.addChild(
      chunksSceneGraph,
      Position.create(
        vec3.fromValues(chunk.originX, chunk.originY, chunk.originZ)
      ),
      chunk.name
    )
  );
}
