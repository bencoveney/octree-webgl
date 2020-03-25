import "./index.scss";
import { initialiseShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { createModelBuffers } from "./render/model";
import { drawScene } from "./render/drawScene";
import { createPosition } from "./position";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaderProgramInfo = initialiseShaders(gl);
  const buffers = createModelBuffers(gl, model);

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

    worldPosition.rotation[1] = totalTime;

    drawScene(
      gl,
      shaderProgramInfo,
      buffers,
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
