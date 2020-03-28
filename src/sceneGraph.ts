import * as Position from "./position";

export type SceneGraphNode = {
  parent: SceneGraphNode | null;
  children: SceneGraphNode[];
  position: Position.Position;
};

export function init() {
  return {
    parent: null,
    children: [],
    position: Position.init()
  };
}

export function addChild(
  parent: SceneGraphNode,
  position: Position.Position
): SceneGraphNode {
  const child: SceneGraphNode = { parent, children: [], position };
  parent.children.push(child);
  return child;
}
