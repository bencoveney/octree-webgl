import "./index.scss";
import { initialiseShaders, initialiseLineShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { model as lineModel } from "./render/axisModel";
import { createModelBuffers } from "./render/model";
import { createModelBuffers as createLineModelBuffers } from "./render/lineModel";
import { drawScene } from "./render/drawScene";
import { createPosition } from "./position";
import * as Octree from "./octree";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaderProgramInfo = initialiseShaders(gl);
  const lineShaderProgramInfo = initialiseLineShaders(gl);
  const buffers = createModelBuffers(gl, model);
  const lineBuffers = createLineModelBuffers(gl, lineModel);

  let totalTime = 0;

  const treeSize = 2;

  const octree = Octree.create<boolean>(treeSize, ([x, y, z]) => {
    const total = x - 0.5 + (y - 0.5) + (z - 0.5);
    if (total != Math.floor(total)) {
      throw new Error("oops");
    }

    return !!(total % 2);
  });
  const allOctreeCubes = Octree.flatten(octree);
  const filteredOctreeCubes = allOctreeCubes.filter(leaf => leaf.value);
  const cubePositions = filteredOctreeCubes.map(({ center, halfSize }) =>
    createPosition(center[0], center[1], center[2], halfSize)
  );

  const cameraPosition = createPosition(0, 0, Math.pow(2, treeSize + 2), 0);

  const worldPosition = createPosition(0, 0, 0, 0);

  const axisPosition = createPosition(0, 0, 0, Math.pow(2, treeSize));

  gameLoop(deltaTimeMs => {
    const deltaTimeS = deltaTimeMs / 1000;
    setDevToolsText(`${Math.round(1 / deltaTimeS)} fps
${filteredOctreeCubes.length}/${allOctreeCubes.length} cubes`);
    resizeViewport(gl);
    totalTime += deltaTimeS;

    worldPosition.rotation[1] = -totalTime / 2;
    worldPosition.rotation[0] = -Math.sin(totalTime);

    drawScene(
      gl,
      shaderProgramInfo,
      lineShaderProgramInfo,
      buffers,
      lineBuffers,
      cubePositions,
      worldPosition,
      cameraPosition,
      axisPosition
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
