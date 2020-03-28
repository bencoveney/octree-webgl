import { ShaderProgramInfo, Shaders } from "./shaders";
import { mat4, vec3 } from "gl-matrix";
import { Position, toMatrix } from "../position";
import { degToRad } from "../utils";
import { World } from "../world";
import * as SceneGraph from "../sceneGraph";
import * as ModelStore from "./modelStore";
import { getDebugMode } from "../debug/debugMode";

export function render(
  gl: WebGLRenderingContext,
  shaders: Shaders,
  world: World
) {
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const { tri, line } = getRenderables(gl, world);

  drawTriModels(gl, shaders.tri, tri, world);

  gl.disable(gl.DEPTH_TEST);

  drawLineModels(gl, shaders.line, line);
}

function createProjectionMatrix(gl: WebGLRenderingContext): mat4 {
  const fieldOfView = degToRad(45);
  const aspect =
    (gl.canvas as HTMLCanvasElement).clientWidth /
    (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 100;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  return projectionMatrix;
}

function createCameraMatrix(position: Position): mat4 {
  const cameraMatrix = toMatrix(position);
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

function drawTriModels(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  renderables: TriRenderables,
  world: World
) {
  gl.useProgram(programInfo.program);

  bindUniformVector(
    gl,
    programInfo.uniformLocations.ambientLightColor,
    world.ambientLightColor
  );
  bindUniformVector(
    gl,
    programInfo.uniformLocations.directionalLightColor,
    world.directionalLightColor
  );
  bindUniformVector(
    gl,
    programInfo.uniformLocations.directionalLightDirection,
    world.directionalLightDirection
  );

  const projectionMatrix = createProjectionMatrix(gl);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  Object.values(renderables).forEach(({ buffers, modelViews }) => {
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

    modelViews.forEach(modelViewMatrix => {
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
  });
}

function drawLineModels(
  gl: WebGLRenderingContext,
  programInfo: ShaderProgramInfo,
  renderables: LineRenderables
) {
  gl.useProgram(programInfo.program);

  const projectionMatrix = createProjectionMatrix(gl);
  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  Object.values(renderables).forEach(({ buffers, modelViews }) => {
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
    modelViews.forEach(modelViewMatrix => {
      bindUniformMatrix(
        gl,
        programInfo.uniformLocations.modelViewMatrix,
        modelViewMatrix
      );

      // Tell the GPU which order to draw the vertices in.
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      gl.drawElements(gl.LINES, buffers.count, gl.UNSIGNED_SHORT, 0);
    });
  });
}

type TriRenderables = {
  [modelName: string]: {
    buffers: ModelStore.ModelBuffers;
    modelViews: mat4[];
  };
};
type LineRenderables = {
  [modelName: string]: {
    buffers: ModelStore.LineModelBuffers;
    modelViews: mat4[];
  };
};

type Renderables = {
  tri: TriRenderables;
  line: LineRenderables;
};

// Get all renderable objects in the world.
// Group the output by model, so that we can avoid switching buffers too often later.
function getRenderables(gl: WebGLRenderingContext, world: World): Renderables {
  const result: Renderables = {
    tri: {},
    line: {}
  };

  const preferredModelKind: ModelStore.ModelKind = getDebugMode()
    ? "line"
    : "tri";

  walkSceneGraph(world, ({ model }, modelView) => {
    const buffers = ModelStore.getBuffers(gl, model, preferredModelKind);
    if (buffers.kind === "line") {
      if (!result.line[model]) {
        result.line[model] = {
          buffers: buffers,
          modelViews: []
        };
      }
      result.line[model].modelViews.push(modelView);
    } else {
      if (!result.tri[model]) {
        result.tri[model] = {
          buffers: buffers,
          modelViews: []
        };
      }
      result.tri[model].modelViews.push(modelView);
    }
  });

  return result;
}

function walkSceneGraph(
  world: World,
  callback: (node: SceneGraph.SceneGraphNode, modelView: mat4) => void
) {
  function walk(parentMatrix: mat4, childNode: SceneGraph.SceneGraphNode) {
    const childNodeMatrix = mat4.clone(parentMatrix);
    mat4.multiply(
      childNodeMatrix,
      childNodeMatrix,
      toMatrix(childNode.position)
    );
    if (childNode.model) {
      callback(childNode, childNodeMatrix);
    }
    childNode.children.forEach(grandchild => walk(childNodeMatrix, grandchild));
  }

  const cameraMatrix = createCameraMatrix(world.camera.position);
  walk(cameraMatrix, world.sceneGraph);
}
