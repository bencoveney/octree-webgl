import ndarray from "ndarray";
import * as Voxels from "./voxels";
import * as SceneGraph from "./sceneGraph";
import * as Position from "./position";
import { vec3 } from "gl-matrix";
import { forEach3d } from "./utils";

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

export function chunkName(x: number, y: number, z: number): string {
  return `chunk_${x}_${y}_${z}`;
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
