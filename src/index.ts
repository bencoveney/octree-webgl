import "./index.scss";
import { initialiseShaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./debug/devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model as cubeModel } from "./render/models/cubeModel";
import { model as axisModel } from "./render/models/axisModel";
import { render } from "./render/render";
import * as ModelStore from "./render/modelStore";
import { getDebugMode } from "./debug/debugMode";
import { setUpWorld, update } from "./world";

function main() {
  const gl = createViewport();
  initDevTools();
  const shaders = initialiseShaders(gl);

  ModelStore.storeModel("cube", cubeModel);
  ModelStore.storeLineModel("axis", axisModel);

  const world = setUpWorld();

  gameLoop((deltaTimeMs, totalTimeMs) => {
    const deltaTimeS = deltaTimeMs / 1000;
    resizeViewport(gl);

    update(world, deltaTimeMs, totalTimeMs);

    render(gl, shaders, world);

    setDevToolsText(`fps: ${Math.round(1 / deltaTimeS)}
debug: ${getDebugMode()} (press D to toggle)`);
  });
}

function gameLoop(tick: (deltaTimeMs: number, totalTimeMs: number) => void) {
  let lastTimeMs = 0;
  let totalTimeMs = 0;

  function doLoop(currentTimeMs: number) {
    const deltaTimeMs = currentTimeMs - lastTimeMs;
    lastTimeMs = currentTimeMs;
    totalTimeMs += deltaTimeMs;
    tick(deltaTimeMs, totalTimeMs);
    requestAnimationFrame(doLoop);
  }

  requestAnimationFrame(doLoop);
}

window.addEventListener("load", main, false);
