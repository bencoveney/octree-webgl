import { ShaderProgramInfo, Shaders } from "./shaders";
import { mat4, vec3 } from "gl-matrix";
import { Position, toMatrix } from "../world/position";
import { degToRad, SKYBLUE } from "../utils";
import { World } from "../world/world";
import * as SceneGraph from "../world/sceneGraph";
import * as ModelStore from "./modelStore";
import { getDebugMode } from "../debug/debugMode";

// "skyblue"
const clearColor = SKYBLUE.map((value) => value / 255);

export function render(
  gl: WebGL2RenderingContext,
  shaders: Shaders,
  world: World
) {
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.depthFunc(gl.LEQUAL);

  gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const { tri, line } = getRenderables(world);

  if (projectionMatrix === null) {
    projectionMatrix = createProjectionMatrix(gl);
  }

  drawTriModels(gl, projectionMatrix, shaders.tri, tri, world);

  gl.disable(gl.DEPTH_TEST);

  drawLineModels(gl, projectionMatrix, shaders.line, line);
}

function createProjectionMatrix(gl: WebGL2RenderingContext): mat4 {
  const fieldOfView = degToRad(45);
  const aspect =
    (gl.canvas as HTMLCanvasElement).clientWidth /
    (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 500;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  return projectionMatrix;
}

let projectionMatrix: mat4 | null = null;

function createCameraMatrix(position: Position): mat4 {
  // TODO: avoid reallocating
  const cameraMatrix = mat4.create();
  toMatrix(cameraMatrix, position);
  mat4.invert(cameraMatrix, cameraMatrix);
  return cameraMatrix;
}

function createNormalMatrix(modelViewMatrix: mat4): mat4 {
  // TODO: avoid reallocating
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  return normalMatrix;
}

function bindUniformMatrix(
  gl: WebGL2RenderingContext,
  uniformLocation: WebGLUniformLocation,
  matrix: mat4
) {
  gl.uniformMatrix4fv(uniformLocation, false, matrix);
}

function bindUniformVector(
  gl: WebGL2RenderingContext,
  uniformLocation: WebGLUniformLocation,
  vector: vec3
) {
  gl.uniform3fv(uniformLocation, vector);
}

function drawTriModels(
  gl: WebGL2RenderingContext,
  projectionMatrix: mat4,
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

  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  for (const { buffers, modelViews } of Object.values(renderables)) {
    // Tell the GPU which values to insert into the shaders for position, color, normal.
    gl.bindVertexArray(buffers.vao);

    for (const modelViewMatrix of modelViews) {
      // TODO: Does this need to be updated per-chunk?
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

      gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
    }
  }
}

function drawLineModels(
  gl: WebGL2RenderingContext,
  projectionMatrix: mat4,
  programInfo: ShaderProgramInfo,
  renderables: LineRenderables
) {
  gl.useProgram(programInfo.program);

  bindUniformMatrix(
    gl,
    programInfo.uniformLocations.projectionMatrix,
    projectionMatrix
  );

  Object.values(renderables).forEach(({ buffers, modelViews }) => {
    gl.bindVertexArray(buffers.vao);
    modelViews.forEach((modelViewMatrix) => {
      bindUniformMatrix(
        gl,
        programInfo.uniformLocations.modelViewMatrix,
        modelViewMatrix
      );

      gl.drawElements(gl.LINES, buffers.count, gl.UNSIGNED_SHORT, 0);
    });
  });
}

type TriRenderables = {
  [modelName: string]: {
    buffers: ModelStore.TriBuffers;
    modelViews: mat4[];
  };
};
type LineRenderables = {
  [modelName: string]: {
    buffers: ModelStore.LineBuffers;
    modelViews: mat4[];
  };
};

type Renderables = {
  tri: TriRenderables;
  line: LineRenderables;
};

// Get all renderable objects in the world.
// Group the output by model, so that we can avoid switching buffers too often later.
function getRenderables(world: World): Renderables {
  const result: Renderables = {
    tri: {},
    line: {},
  };

  const preferredModelKind: ModelStore.ModelKind = getDebugMode()
    ? "line"
    : "tri";

  walkSceneGraph(world, ({ model }, modelView) => {
    const buffers = ModelStore.getBuffers(model, preferredModelKind);
    if (buffers.kind === "line") {
      if (!result.line[model]) {
        result.line[model] = {
          buffers: buffers,
          modelViews: [],
        };
      }
      result.line[model].modelViews.push(modelView);
    } else {
      if (!result.tri[model]) {
        result.tri[model] = {
          buffers: buffers,
          modelViews: [],
        };
      }
      result.tri[model].modelViews.push(modelView);
    }
  });

  return result;
}

function walkSceneGraph(
  world: World,
  callback: (
    node: SceneGraph.SceneGraphNode & { model: string },
    modelView: mat4
  ) => void
) {
  function walk(parentMatrix: mat4, childNode: SceneGraph.SceneGraphNode) {
    // Compute the world position (use a cache to avoid reallocating)
    mat4.identity(childNode.worldPositionCache);
    toMatrix(childNode.worldPositionCache, childNode.position);
    mat4.multiply(
      childNode.worldPositionCache,
      parentMatrix,
      childNode.worldPositionCache
    );

    if (childNode.model) {
      callback(
        childNode as SceneGraph.SceneGraphNode & { model: string },
        childNode.worldPositionCache
      );
    }
    childNode.children.forEach((grandchild) =>
      walk(childNode.worldPositionCache, grandchild)
    );
  }

  const cameraMatrix = createCameraMatrix(world.camera.position);
  walk(cameraMatrix, world.sceneGraph);
}
