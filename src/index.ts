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

function main() {
  const gl = createViewport();
  initDevTools();
  const shaderProgramInfo = initialiseShaders(gl);
  const lineShaderProgramInfo = initialiseLineShaders(gl);
  const buffers = createModelBuffers(gl, model);
  const lineBuffers = createLineModelBuffers(gl, lineModel);

  var totalTime = 0;

  const cubes = [
    createPosition(0, 0, 0),
    createPosition(3, 0, 0),
    createPosition(0, 3, 0),
    createPosition(-3, 0, 0),
    createPosition(0, -3, 0)
  ];

  const cameraPosition = createPosition(0, 0, 10);

  const worldPosition = createPosition(0, 0, 0);

  gameLoop(deltaTimeMs => {
    const deltaTimeS = deltaTimeMs / 1000;
    setDevToolsText(`${Math.round(1 / deltaTimeS)} fps`);
    resizeViewport(gl);
    totalTime += deltaTimeS;

    worldPosition.rotation[1] = -totalTime;

    drawScene(
      gl,
      shaderProgramInfo,
      lineShaderProgramInfo,
      buffers,
      lineBuffers,
      cubes,
      worldPosition,
      cameraPosition
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
