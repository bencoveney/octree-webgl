import * as SceneGraph from "./sceneGraph";
import * as Position from "./position";
import { vec3 } from "gl-matrix";

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
