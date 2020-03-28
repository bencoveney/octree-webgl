import * as Position from "./position";

export type ThingToDraw = "cube" | "axis" | null;

export type SceneGraphNode = {
  parent: SceneGraphNode | null;
  children: SceneGraphNode[];
  position: Position.Position;
  thingToDraw: ThingToDraw;
};

export function init() {
  return {
    parent: null,
    children: [],
    position: Position.init(),
    thingToDraw: null
  };
}

export function addChild(
  parent: SceneGraphNode,
  position: Position.Position,
  thingToDraw: ThingToDraw
): SceneGraphNode {
  const child: SceneGraphNode = { parent, children: [], position, thingToDraw };
  parent.children.push(child);
  return child;
}
