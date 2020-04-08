import ndarray from "ndarray";
import * as Voxels from "./voxels";
import * as VoxelFactories from "./voxelFactories";
import * as ModelStore from "./render/modelStore";
import * as SceneGraph from "./sceneGraph";
import * as Position from "./position";
import { vec3 } from "gl-matrix";

export type Chunks = ndarray<Chunk>;
export type Chunk = {
  voxels: Voxels.Voxels;
  // Lowest point in each dimension.
  originX: number;
  originY: number;
  originZ: number;
  // Size (voxels.shape[0]).
  size: number;
};

export function createChunks(
  chunkSize: number,
  chunkAmount: number,
  sceneGraph: SceneGraph.SceneGraphNode
): Chunks {
  const chunksSceneGraph = SceneGraph.addChild(
    sceneGraph,
    Position.init(),
    null
  );
  const chunks = new Array(chunkAmount * chunkAmount * chunkAmount);
  const chunksNdarray = ndarray<Chunk>(chunks, [
    chunkAmount,
    chunkAmount,
    chunkAmount,
  ]);

  const lowerBound = 0 - (chunkAmount * chunkSize) / 2;

  for (let x = 0; x < chunkAmount; x++) {
    for (let y = 0; y < chunkAmount; y++) {
      for (let z = 0; z < chunkAmount; z++) {
        const originX = lowerBound + chunkSize * x;
        const originY = lowerBound + chunkSize * y;
        const originZ = lowerBound + chunkSize * z;

        const voxels = Voxels.create(
          chunkSize,
          VoxelFactories.positionedTerrain(originX, originY, originZ)
        );

        const faces = Voxels.voxelsToMesh(voxels);

        const modelName = `chunk_${x}_${y}_${z}`;
        ModelStore.storeModel(modelName, faces);
        SceneGraph.addChild(
          chunksSceneGraph,
          Position.create(vec3.fromValues(originX, originY, originZ)),
          modelName
        );

        chunksNdarray.set(x, y, z, ({
          voxels,
          originX,
          originY,
          originZ,
          size: chunkSize,
        } as Chunk) as any);
      }
    }
  }

  return chunksNdarray;
}
