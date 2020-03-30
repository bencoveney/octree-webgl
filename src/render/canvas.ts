import "./canvas.scss";

let canvas: HTMLCanvasElement;

export function createViewport(): WebGLRenderingContext {
  canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  document.body.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    powerPreference: "high-performance",
    antialias: true
  });

  if (gl === null) {
    throw "Unable to initialize WebGL. Your browser or machine may not support it.";
  }

  return gl;
}

export function resizeViewport(gl: WebGLRenderingContext) {
  const realToCSSPixels = window.devicePixelRatio;
  const displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
  const displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}
