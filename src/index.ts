import "./index.scss";
import { initialiseShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { createModelBuffers } from "./render/model";
import { drawScene } from "./render/drawScene";
import { createCube, createPositionMatrix } from "./cube";
import { mat4 } from "gl-matrix";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaderProgramInfo = initialiseShaders(gl);
  const buffers = createModelBuffers(gl, model);

  var totalTime = 0;

  const cubes = [
    createCube(0, 0, -7),
    createCube(3, 0, -7),
    createCube(0, 3, -7)
  ];

  gameLoop(deltaTimeMs => {
    const deltaTimeS = deltaTimeMs / 1000;
    setDevToolsText(`${Math.round(1 / deltaTimeS)} fps`);
    resizeViewport(gl);
    totalTime += deltaTimeS;
    drawScene(gl, shaderProgramInfo, buffers, cubes);
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
