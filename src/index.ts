import "./index.scss";
import { mat4 } from "gl-matrix";
import { initialiseShaders, ShaderProgramInfo } from "./render/shaders";
import { initDevTools, setDevToolsText } from "./devTools";
import { createViewport, resizeViewport } from "./render/canvas";
import { model } from "./render/cubeModel";
import { createModelBuffers, ModelBuffers } from "./render/model";

function main() {
  const gl = createViewport();

  initDevTools();

  const shaderProgramInfo = initialiseShaders(gl);

  const buffers = createModelBuffers(gl, model);

  var cubeRotation = 0.0;

  var lastTime = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;
    const deltaTime = now - lastTime;
    lastTime = now;

    const fps = Math.round(1 / deltaTime);

    setDevToolsText(`${fps} fps`);

    cubeRotation += deltaTime;

    resizeViewport(gl);
    drawScene(gl, shaderProgramInfo, buffers, cubeRotation);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

window.addEventListener("load", main, false);

function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  buffers: ModelBuffers,
  cubeRotation: number
) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = (45 * Math.PI) / 180;
  const aspect =
    (gl.canvas as HTMLCanvasElement).clientWidth /
    (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, -10.0]);

  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 1]);

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attributeLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attributeLocations.vertexPosition);
  }

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attributeLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attributeLocations.vertexColor);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
      programInfo.attributeLocations.vertexNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attributeLocations.vertexNormal);
  }

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix
  );

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}
