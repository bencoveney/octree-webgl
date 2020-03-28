import "./index.scss";
import { initialiseShaders, initialiseLineShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./debug/devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { model as lineModel } from "./render/axisModel";
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
  const shaderProgramInfo = initialiseShaders(gl);
  const lineShaderProgramInfo = initialiseLineShaders(gl);
  ModelStore.storeModel("cube", model);
  ModelStore.storeLineModel("axis", lineModel);

  let totalTime = 0;

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

  gameLoop(deltaTimeMs => {
    const deltaTimeS = deltaTimeMs / 1000;
    resizeViewport(gl);
    totalTime += deltaTimeS;

    world.sceneGraph.position.rotation[1] = -totalTime / 2;

    render(gl, shaderProgramInfo, lineShaderProgramInfo, world);

    setDevToolsText(`fps: ${Math.round(1 / deltaTimeS)}
cubes: ${filteredOctreeCubes.length}/${allOctreeCubes.length}
debug: ${getDebugMode()} (press D to toggle)`);
  });
}

function gameLoop(tick: (deltaTimeMs) => void) {
  var lastTimeMs = 0;

  function doLoop(currentTimeMs) {
    const deltaTimeMs = currentTimeMs - lastTimeMs;
    lastTimeMs = currentTimeMs;
    tick(deltaTimeMs);
    requestAnimationFrame(doLoop);
  }

  requestAnimationFrame(doLoop);
}

window.addEventListener("load", main, false);
