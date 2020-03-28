import * as Position from "./position";

export type SceneGraphNode = {
  parent: SceneGraphNode | null;
  children: SceneGraphNode[];
  position: Position.Position;
  model: string | null;
};

export function init(): SceneGraphNode {
  return {
    parent: null,
    children: [],
    position: Position.init(),
    model: null
  };
}

export function addChild(
  parent: SceneGraphNode,
  position: Position.Position,
  model: string | null
): SceneGraphNode {
  const child: SceneGraphNode = { parent, children: [], position, model };
  parent.children.push(child);
  return child;
}
