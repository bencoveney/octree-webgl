import { ShaderProgramInfo } from "./shaders";
import { ModelBuffers } from "./model";
import { mat4 } from "gl-matrix";

export function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  buffers: ModelBuffers,
  cubeRotation: number
) {
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Clear the screen.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  // Tell the GPU which values to insert into the shaders for position, color, normal.
  bindAttributeBuffer(
    gl,
    buffers.position,
    programInfo.attributeLocations.vertexPosition,
    3
  );

  bindAttributeBuffer(
    gl,
    buffers.color,
    programInfo.attributeLocations.vertexColor,
    4
  );

  bindAttributeBuffer(
    gl,
    buffers.normal,
    programInfo.attributeLocations.vertexNormal,
    3
  );

  // Tell the GPU which matrices to use for projection, model-view and normals
  const projectionMatrix = createProjectionMatrix(gl);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  const modelViewMatrix = createModelViewMatrix(cubeRotation);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.modelViewMatrix,
    modelViewMatrix
  );

  const normalMatrix = createNormalMatrix(modelViewMatrix);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.normalMatrix,
    normalMatrix
  );

  // Tell the GPU which order to draw the vertices in.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function createProjectionMatrix(gl: WebGLRenderingContext): mat4 {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect =
    (gl.canvas as HTMLCanvasElement).clientWidth /
    (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  return projectionMatrix;
}

function createModelViewMatrix(cubeRotation: number): mat4 {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, -10.0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 1]);
  return modelViewMatrix;
}

function createNormalMatrix(modelViewMatrix: mat4): mat4 {
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  return normalMatrix;
}

function bindAttributeBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  attributeLocation: number,
  numberOfComponents: number
) {
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    attributeLocation,
    numberOfComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(attributeLocation);
}

function bindUniformMatrix(
  gl: WebGLRenderingContext,
  uniformLocation: WebGLUniformLocation,
  matrix: mat4
) {
  gl.uniformMatrix4fv(uniformLocation, false, matrix);
}
