import "./index.scss";
import { initialiseShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./debug/devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model as cubeModel } from "./render/models/cubeModel";
import { model as axisModel } from "./render/models/axisModel";
import { render } from "./render/render";
import * as Position from "./position";
import * as Octree from "./octree";
import * as World from "./world";
import * as SceneGraph from "./sceneGraph";
import * as ModelStore from "./render/modelStore";
import { vec3 } from "gl-matrix";
import { getDebugMode } from "./debug/debugMode";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaders = initialiseShaders(gl);

  ModelStore.storeModel("cube", cubeModel);
  ModelStore.storeLineModel("axis", axisModel);

  const world = initWorld();

  gameLoop((deltaTimeMs, totalTimeMs) => {
    const deltaTimeS = deltaTimeMs / 1000;
    resizeViewport(gl);

    world.sceneGraph.position.rotation[1] = -totalTimeMs / 2000;

    render(gl, shaders, world);

    setDevToolsText(`fps: ${Math.round(1 / deltaTimeS)}
debug: ${getDebugMode()} (press D to toggle)`);
  });
}

function gameLoop(tick: (deltaTimeMs, totalTimeMs) => void) {
  var lastTimeMs = 0;
  let totalTimeMs = 0;

  function doLoop(currentTimeMs) {
    const deltaTimeMs = currentTimeMs - lastTimeMs;
    lastTimeMs = currentTimeMs;
    totalTimeMs += deltaTimeMs;
    tick(deltaTimeMs, totalTimeMs);
    requestAnimationFrame(doLoop);
  }

  requestAnimationFrame(doLoop);
}

window.addEventListener("load", main, false);

function initWorld(): World.World {
  const treeSize = 3;

  const world = World.create(
    Position.create(0, 0, Math.pow(2, treeSize + 2), 1),
    vec3.fromValues(0.3, 0.3, 0.3),
    vec3.fromValues(1, 1, 1),
    vec3.fromValues(0.85, 0.8, 0.75)
  );

  world.sceneGraph.position.rotation[0] = 0.4;

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");

  const octreeNode = SceneGraph.addChild(
    world.sceneGraph,
    Position.init(),
    null
  );

  const octree = Octree.create<boolean>(treeSize, (position, fullSize) => {
    const halfSize = fullSize / 2;
    const distance = vec3.distance(position, vec3.create());
    return distance < halfSize;
  });
  const allOctreeCubes = Octree.flatten(octree);
  const filteredOctreeCubes = allOctreeCubes.filter(leaf => leaf.value);
  filteredOctreeCubes
    .map(({ center, halfSize }) =>
      Position.create(center[0], center[1], center[2], halfSize)
    )
    .forEach(cubePosition => {
      SceneGraph.addChild(octreeNode, cubePosition, "cube");
    });

  return world;
}
