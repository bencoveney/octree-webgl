import "./canvas.scss";

let canvas: HTMLCanvasElement;
let gl: WebGLRenderingContext;

export function createViewport(): WebGLRenderingContext {
  canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  document.body.appendChild(canvas);

  gl = canvas.getContext("webgl", {
    powerPreference: "high-performance",
    antialias: true
  });
  if (gl === null) {
    throw "Unable to initialize WebGL. Your browser or machine may not support it.";
  }

  return gl;
}

export function resizeViewport(gl: WebGLRenderingContext) {
  var realToCSSPixels = window.devicePixelRatio;
  var displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
  var displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}
