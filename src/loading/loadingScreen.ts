import "./loadingScreen.scss";
import ndarray from "ndarray";

let screenElement: HTMLDivElement | null = null;

let canvasElement: HTMLCanvasElement | null = null;
let canvasContext: CanvasRenderingContext2D | null = null;

let textElement: HTMLDivElement | null = null;

export function createLoadingScreen() {
  if (screenElement) {
    return;
  }
  screenElement = document.createElement("div");
  screenElement.setAttribute("id", "loading-screen");
  document.body.appendChild(screenElement);

  canvasElement = document.createElement("canvas");
  canvasElement.setAttribute("id", "loading-screen-canvas");
  screenElement.appendChild(canvasElement);

  canvasContext = canvasElement.getContext("2d", { alpha: false });

  textElement = document.createElement("div");
  textElement.setAttribute("id", "loading-screen-text");
  screenElement.appendChild(textElement);

  setLoadingScreenText("Loading");

  resizeViewport();
  window.addEventListener("resize", resizeViewport);
}

export function setLoadingScreenText(message: string) {
  if (!textElement) {
    return;
  }
  textElement.innerText = message;
}

export function setLoadingScreenCanvas(
  message: string,
  axisSize: number,
  heightmap: Float32Array
) {
  setLoadingScreenText(message);

  if (canvasContext === null) {
    return;
  }

  let minValue = Number.MAX_SAFE_INTEGER;
  let maxValue = Number.MIN_SAFE_INTEGER;

  for (let i = 0; i < heightmap.length; i++) {
    minValue = Math.min(heightmap[i], minValue);
    maxValue = Math.max(heightmap[i], maxValue);
  }

  const heightmapLookup = ndarray(heightmap, [axisSize, axisSize]);

  const width = canvasContext.canvas.clientWidth;
  const height = canvasContext.canvas.clientHeight;

  const stepX = width / axisSize;
  const stepY = height / axisSize;

  const valueRange = maxValue - minValue;

  for (let x = 0; x < axisSize; x++) {
    for (let y = 0; y < axisSize; y++) {
      const value = heightmapLookup.get(x, y);

      const scaledValue = (value - minValue) / valueRange;
      const color = Math.min(scaledValue * 255, 255);

      const xPos = (x / axisSize) * width;
      const yPos = (y / axisSize) * height;

      canvasContext.fillStyle = `rgb(${color},${color},${color})`;

      canvasContext.fillRect(
        Math.floor(xPos),
        Math.floor(yPos),
        Math.ceil(stepX),
        Math.ceil(stepY)
      );
    }
  }
}

export function destroyLoadingScreen() {
  textElement && textElement.remove();
  textElement = null;

  canvasElement && canvasElement.remove();
  canvasElement = null;

  canvasContext = null;

  screenElement && screenElement.remove();
  screenElement = null;
}

function resizeViewport() {
  if (canvasElement) {
    const realToCSSPixels = window.devicePixelRatio;
    const displayWidth = Math.floor(
      canvasElement.clientWidth * realToCSSPixels
    );
    const displayHeight = Math.floor(
      canvasElement.clientHeight * realToCSSPixels
    );

    if (
      canvasElement.width !== displayWidth ||
      canvasElement.height !== displayHeight
    ) {
      canvasElement.width = displayWidth;
      canvasElement.height = displayHeight;
    }

    window.removeEventListener("resize", resizeViewport);
  }
}
