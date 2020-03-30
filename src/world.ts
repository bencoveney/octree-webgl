import * as Position from "./position";
import * as Octree from "./octree";
import * as SceneGraph from "./sceneGraph";
import { vec3, vec4 } from "gl-matrix";
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
  const treeSize = 6;
  const world = create(
    Position.create(0, 0, Math.pow(2, treeSize) + treeSize * 3, 1),
    [0.3, 0.3, 0.3],
    [1, 1, 1],
    [0.85, 0.8, 0.75]
  );

  world.sceneGraph.position.rotation[0] = 0.4;

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");

  const octree = Octree.create<boolean>(treeSize, (position, fullSize) => {
    const halfSize = fullSize / 2;
    const distance = vec3.distance(position, [0, 0, 0]);
    return distance < halfSize;
  });
  const lookup = Octree.createLookup(octree);
  const faces = Octree.lookupToMesh(lookup, leaf =>
    leaf.value ? [1, 1, 1, 1] : null
  );
  ModelStore.storeModel("cubegen", faces);
  SceneGraph.addChild(world.sceneGraph, Position.init(), "cubegen");

  return world;
}
