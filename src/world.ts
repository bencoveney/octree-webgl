import * as Position from "./position";
import * as Voxels from "./voxels";
import * as SceneGraph from "./sceneGraph";
import { vec3 } from "gl-matrix";
import * as ModelStore from "./render/modelStore";

export type World = {
  sceneGraph: SceneGraph.SceneGraphNode;
  camera: SceneGraph.SceneGraphNode;
  ambientLightColor: vec3;
  directionalLightColor: vec3;
  directionalLightDirection: vec3;
};

export function create(
  cameraPosition: Position.Position,
  ambientLightColor: vec3,
  directionalLightColor: vec3,
  directionalLightDirection: vec3
): World {
  const worldSceneGraph = SceneGraph.init();
  const cameraNode = SceneGraph.addChild(worldSceneGraph, cameraPosition, null);
  return {
    sceneGraph: worldSceneGraph,
    camera: cameraNode,
    ambientLightColor,
    directionalLightColor,
    directionalLightDirection
  };
}

export function setUpWorld(): World {
  const depth = 6;
  const size = Math.pow(2, depth);
  const halfSize = size / 2;

  const world = create(
    Position.create(0, 0, size + depth * 3, 1),
    [0.3, 0.3, 0.3],
    [1, 1, 1],
    [0.85, 0.8, 0.75]
  );

  world.sceneGraph.position.rotation[0] = 0.4;

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");

  const voxels = Voxels.create<boolean>(
    size,
    (x, y, z) =>
      vec3.distance([x, y, z], [halfSize, halfSize, halfSize]) < halfSize
  );
  const faces = Voxels.voxelsToMesh(voxels, leaf =>
    leaf ? [1, 1, 1, 1] : null
  );
  ModelStore.storeModel("cubegen", faces);
  SceneGraph.addChild(world.sceneGraph, Position.init(), "cubegen");

  return world;
}
