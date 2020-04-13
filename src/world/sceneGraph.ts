import * as Position from "./position";
import { mat4 } from "gl-matrix";

export type SceneGraphNode = {
  parent: SceneGraphNode | null;
  children: SceneGraphNode[];
  position: Position.Position;
  model: string | null;
  worldPositionCache: mat4;
  normalCache: mat4;
};

export function init(): SceneGraphNode {
  return {
    parent: null,
    children: [],
    position: Position.init(),
    model: null,
    worldPositionCache: mat4.create(),
    normalCache: mat4.create(),
  };
}

export function addChild(
  parent: SceneGraphNode,
  position: Position.Position,
  model: string | null
): SceneGraphNode {
  const child: SceneGraphNode = {
    parent,
    children: [],
    position,
    model,
    worldPositionCache: mat4.create(),
    normalCache: mat4.create(),
  };
  parent.children.push(child);
  return child;
}
