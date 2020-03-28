import { ShaderProgramInfo } from "./shaders";
import { ModelBuffers } from "./model";
import { mat4, vec3 } from "gl-matrix";
import { Position, createPositionMatrix } from "../position";
import { degToRad } from "../utils";
import { LineModelBuffers } from "./lineModel";

export function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  lineProgramInfo: ShaderProgramInfo,
  buffers: ModelBuffers,
  lineBuffers: LineModelBuffers,
  lineBuffers2: LineModelBuffers,
  cubePositions: Position[],
  worldPosition: Position,
  cameraPosition: Position,
  axisPosition: Position,
  ambientLightColor: vec3,
  directionalLightColor: vec3,
  directionalLightDirection: vec3
) {
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Clear the screen.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawModel(
    gl,
    programInfo,
    buffers,
    cubePositions,
    worldPosition,
    cameraPosition,
    ambientLightColor,
    directionalLightColor,
    directionalLightDirection
  );

  gl.disable(gl.DEPTH_TEST);

  drawLineModel(
    gl,
    lineProgramInfo,
    lineBuffers,
    [axisPosition],
    worldPosition,
    cameraPosition
  );

  drawLineModel(
    gl,
    lineProgramInfo,
    lineBuffers2,
    cubePositions,
    worldPosition,
    cameraPosition
  );
}

function createProjectionMatrix(gl: WebGLRenderingContext): mat4 {
  const fieldOfView = degToRad(45);
  const aspect =
    (gl.canvas as HTMLCanvasElement).clientWidth /
    (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  return projectionMatrix;
}

function createCameraMatrix(position: Position): mat4 {
  const cameraMatrix = createPositionMatrix(position);
  mat4.invert(cameraMatrix, cameraMatrix);
  return cameraMatrix;
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

function bindUniformVector(
  gl: WebGLRenderingContext,
  uniformLocation: WebGLUniformLocation,
  vector: vec3
) {
  gl.uniform3fv(uniformLocation, vector);
}

function drawModel(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  buffers: ModelBuffers,
  cubePositions: Position[],
  worldPosition: Position,
  cameraPosition: Position,
  ambientLightColor: vec3,
  directionalLightColor: vec3,
  directionalLightDirection: vec3
) {
  gl.useProgram(programInfo.program);

  bindUniformVector(
    gl,
    programInfo.uniformLocations.ambientLightColor,
    ambientLightColor
  );

  bindUniformVector(
    gl,
    programInfo.uniformLocations.directionalLightColor,
    directionalLightColor
  );

  bindUniformVector(
    gl,
    programInfo.uniformLocations.directionalLightDirection,
    directionalLightDirection
  );

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

  const cameraMatrix = createCameraMatrix(cameraPosition);
  const worldMatrix = createPositionMatrix(worldPosition);

  cubePositions.forEach(position => {
    const positionMatrix = createPositionMatrix(position);

    const modelViewMatrix = mat4.clone(cameraMatrix);

    // Move world relative to camera
    mat4.multiply(modelViewMatrix, modelViewMatrix, worldMatrix);

    // Move cube relative to world
    mat4.multiply(modelViewMatrix, modelViewMatrix, positionMatrix);

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
    gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
  });
}

function drawLineModel(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  buffers: LineModelBuffers,
  positions: Position[],
  worldPosition: Position,
  cameraPosition: Position
) {
  gl.useProgram(programInfo.program);

  // Tell the GPU which values to insert into the shaders for position, color.
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

  // Tell the GPU which matrices to use for projection, model-view and normals
  const projectionMatrix = createProjectionMatrix(gl);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  const cameraMatrix = createCameraMatrix(cameraPosition);
  const worldMatrix = createPositionMatrix(worldPosition);

  positions.forEach(position => {
    const positionMatrix = createPositionMatrix(position);

    const modelViewMatrix = mat4.clone(cameraMatrix);

    // Move world relative to camera
    mat4.multiply(modelViewMatrix, modelViewMatrix, worldMatrix);

    // Move cube relative to world
    mat4.multiply(modelViewMatrix, modelViewMatrix, positionMatrix);

    bindUniformMatrix(
      gl,
      programInfo.uniformLocations.modelViewMatrix,
      modelViewMatrix
    );

    // Tell the GPU which order to draw the vertices in.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
    gl.drawElements(gl.LINES, buffers.count, gl.UNSIGNED_SHORT, 0);
  });
}
