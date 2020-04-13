import "./index.scss";
import { initialiseShaders, Shaders } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./debug/devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model as cubeModel } from "./render/models/cubeModel";
import { model as axisModel } from "./render/models/axisModel";
import { render } from "./render/render";
import * as ModelStore from "./render/modelStore";
import { DEBUG_KEY } from "./debug/debugMode";
import { setUpWorld, update, World } from "./world/world";
import { setUpMouseHandler } from "./input/mouseHandler";
import * as LoadingScreen from "./loading/loadingScreen";

function main() {
  loadGame().then(runGame);
}

type Game = {
  gl: WebGL2RenderingContext;
  shaders: Shaders;
  world: World;
};

async function loadGame(): Promise<Game> {
  LoadingScreen.createLoadingScreen();

  const gl = createViewport();
  initDevTools();
  const shaders = initialiseShaders(gl);

  const world = await setUpWorld(gl);

  ModelStore.storeModel(gl, "cube", cubeModel);
  ModelStore.storeLineModel(gl, "axis", axisModel);

  setUpMouseHandler(gl.canvas as HTMLCanvasElement);

  LoadingScreen.destroyLoadingScreen();

  return { world, gl, shaders };
}

function runGame({ world, gl, shaders }: Game) {
  gameLoop((deltaTimeMs, totalTimeMs) => {
    const deltaTimeS = deltaTimeMs / 1000;
    resizeViewport(gl);

    update(world, deltaTimeMs, totalTimeMs);

    render(gl, shaders, world);

    setDevToolsText(`FPS: ${Math.round(1 / deltaTimeS)}
Debug: ${DEBUG_KEY.toUpperCase()}
Move: W,A,S,D
Jump: Space`);
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
