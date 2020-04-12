import "./canvas.scss";

let canvas: HTMLCanvasElement;

export function createViewport(): WebGL2RenderingContext {
  canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  document.body.appendChild(canvas);

  const webGlOptions: WebGLContextAttributes = {
    powerPreference: "high-performance",
    antialias: false, // slow on 4k :(
  };

  let gl = canvas.getContext("webgl2", webGlOptions);

  if (!gl) {
    throw new Error(
      "Unable to initialize WebGL2 canvas context. Your browser or machine may not support it."
    );
  }

  return gl;
}

export function resizeViewport(gl: WebGL2RenderingContext) {
  const realToCSSPixels = window.devicePixelRatio;
  const displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
  const displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}
