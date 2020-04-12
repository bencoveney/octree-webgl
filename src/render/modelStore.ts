import { AttributeLocations } from "./shaders";

export type ModelKind = "tri" | "line";

export type LineGeometry = {
  position: Float32Array;
  color: Float32Array;
  index: Uint16Array;
};

export type LineBuffers = {
  kind: "line";
  count: number;
  vao: WebGLVertexArrayObject;
};

export type TriGeometry = {
  position: Float32Array;
  color: Float32Array;
  index: Uint16Array;
  normal: Float32Array;
};

export type TriBuffers = {
  kind: "tri";
  count: number;
  vao: WebGLVertexArrayObject;
};

const modelStore: Map<string, TriBuffers> = new Map();

export function storeModel(
  gl: WebGL2RenderingContext,
  name: string,
  model: TriGeometry
) {
  const count = model.index.length;
  const vao = createTriVertexArray(gl, model);
  modelStore.set(name, { kind: "tri", count, vao });

  // Should probably only do this if debugging.
  const lineModel = convertToLineModel(model);
  storeLineModel(gl, name, lineModel);
}

const lineStore: Map<string, LineBuffers> = new Map();

export function storeLineModel(
  gl: WebGL2RenderingContext,
  name: string,
  model: LineGeometry
) {
  const count = model.index.length;
  const vao = createLineVertexArray(gl, model);
  lineStore.set(name, { kind: "line", count, vao });
}

export function getBuffers(
  name: string,
  preferred: ModelKind
): TriBuffers | LineBuffers {
  if (preferred === "tri") {
    if (modelStore.has(name)) {
      return modelStore.get(name) as TriBuffers;
    }
  }

  if (lineStore.has(name)) {
    return lineStore.get(name) as LineBuffers;
  }

  throw new Error(`Cannot find any model with name "${name}"`);
}

export function hasBuffers(name: string, preferred: ModelKind) {
  return (preferred === "tri" && modelStore.has(name)) || lineStore.has(name);
}

function createTriVertexArray(
  gl: WebGL2RenderingContext,
  geometry: TriGeometry
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();

  if (vao === null) {
    throw new Error("Could not create vao");
  }

  gl.bindVertexArray(vao);

  bindArrayBuffer(gl, gl.ARRAY_BUFFER, geometry.position);
  describeArrayBuffer(gl, AttributeLocations.vertexPosition, 3);

  bindArrayBuffer(gl, gl.ARRAY_BUFFER, geometry.color);
  describeArrayBuffer(gl, AttributeLocations.vertexColor, 4);

  bindArrayBuffer(gl, gl.ARRAY_BUFFER, geometry.normal);
  describeArrayBuffer(gl, AttributeLocations.vertexNormal, 3);

  bindArrayBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.index);

  // For safety.
  gl.bindVertexArray(null);

  return vao;
}

function createLineVertexArray(
  gl: WebGL2RenderingContext,
  geometry: LineGeometry
): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();

  if (vao === null) {
    throw new Error("Could not create vao");
  }

  gl.bindVertexArray(vao);

  bindArrayBuffer(gl, gl.ARRAY_BUFFER, geometry.position);
  describeArrayBuffer(gl, AttributeLocations.vertexPosition, 3);

  bindArrayBuffer(gl, gl.ARRAY_BUFFER, geometry.color);
  describeArrayBuffer(gl, AttributeLocations.vertexColor, 4);

  bindArrayBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, geometry.index);

  // For safety.
  gl.bindVertexArray(null);

  return vao;
}

function describeArrayBuffer(
  gl: WebGL2RenderingContext,
  attributeLocation: number,
  numberOfComponents: number
) {
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  // Assumes buffer is already bound!
  // gl.bindBuffer(target, buffer);
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

function bindArrayBuffer(
  gl: WebGL2RenderingContext,
  target: number,
  values: BufferSource
) {
  const buffer = gl.createBuffer();

  if (buffer == null) {
    throw new Error("Unable to create buffer");
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, values, gl.STATIC_DRAW);
}

function convertToLineModel({
  position,
  color,
  index,
}: TriGeometry): LineGeometry {
  const newIndex = [];
  for (let triplet = 0; triplet < index.length; triplet += 3) {
    newIndex.push(
      index[triplet],
      index[triplet + 1],
      index[triplet + 1],
      index[triplet + 2],
      index[triplet + 2],
      index[triplet]
    );
  }
  return {
    position,
    color,
    index: Uint16Array.from(newIndex),
  };
}
