import "./index.scss";
import { initialiseShaders, initialiseLineShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { model as lineModel } from "./render/axisModel";
import { createModelBuffers } from "./render/model";
import { createModelBuffers as createLineModelBuffers } from "./render/lineModel";
import { render } from "./render/render";
import { createPosition } from "./position";
import * as Octree from "./octree";
import { vec3 } from "gl-matrix";
import { createLineModel } from "./render/createLineModel";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaderProgramInfo = initialiseShaders(gl);
  const lineShaderProgramInfo = initialiseLineShaders(gl);
  const buffers = createModelBuffers(gl, model);
  const lineBuffers = createLineModelBuffers(gl, lineModel);
  const lineModel2 = createLineModel(model);
  const lineBuffers2 = createLineModelBuffers(gl, lineModel2);

  let totalTime = 0;

  const treeSize = 3;

  const octree = Octree.create<boolean>(treeSize, (position, fullSize) => {
    const halfSize = fullSize / 2;
    const distance = vec3.distance(position, vec3.create());
    return distance < halfSize;
  });
  const allOctreeCubes = Octree.flatten(octree);
  const filteredOctreeCubes = allOctreeCubes.filter(leaf => leaf.value);
  const cubePositions = filteredOctreeCubes.map(({ center, halfSize }) =>
    createPosition(center[0], center[1], center[2], halfSize)
  );

  const cameraPosition = createPosition(0, 0, Math.pow(2, treeSize + 2), 0);

  const worldPosition = createPosition(0, 0, 0, 0);
  worldPosition.rotation[0] = 0.4;

  const axisPosition = createPosition(0, 0, 0, 1);

  const ambientLightColor = vec3.fromValues(0.3, 0.3, 0.3);
  const directionalLightColor = vec3.fromValues(1, 1, 1);
  const directionalLightDirection = vec3.fromValues(0.85, 0.8, 0.75);

  gameLoop(deltaTimeMs => {
    const deltaTimeS = deltaTimeMs / 1000;
    setDevToolsText(`fps: ${Math.round(1 / deltaTimeS)}
cubes: ${filteredOctreeCubes.length}/${allOctreeCubes.length}`);
    resizeViewport(gl);
    totalTime += deltaTimeS;

    worldPosition.rotation[1] = -totalTime / 2;

    render(
      gl,
      shaderProgramInfo,
      lineShaderProgramInfo,
      buffers,
      lineBuffers,
      lineBuffers2,
      cubePositions,
      worldPosition,
      cameraPosition,
      axisPosition,
      ambientLightColor,
      directionalLightColor,
      directionalLightDirection
    );
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
