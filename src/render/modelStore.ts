export type ModelKind = "tri" | "line";

type LineModel<T, U> = {
  position: T;
  color: T;
  index: U;
};

export type LineModelData = LineModel<Float32Array, Uint16Array>;
export type LineModelBuffers = LineModel<WebGLBuffer, WebGLBuffer> & {
  kind: "line";
  count: number;
};

type Model<T, U> = {
  position: T;
  color: T;
  index: U;
  normal: T;
};

export type ModelData = Model<Float32Array, Uint16Array>;
export type ModelBuffers = Model<WebGLBuffer, WebGLBuffer> & {
  kind: "tri";
  count: number;
};

const modelDataStore: Map<string, ModelData> = new Map();
const modelBufferStore: Map<string, ModelBuffers> = new Map();

export function storeModel(name: string, model: ModelData) {
  modelDataStore.set(name, model);
}

const lineModelDataStore: Map<string, LineModelData> = new Map();
const lineModelBufferStore: Map<string, LineModelBuffers> = new Map();

export function storeLineModel(name: string, model: LineModelData) {
  lineModelDataStore.set(name, model);
}

export function getBuffers(
  gl: WebGLRenderingContext,
  name: string,
  preferred: ModelKind
): ModelBuffers | LineModelBuffers {
  if (preferred === "tri") {
    if (modelBufferStore.has(name)) {
      return modelBufferStore.get(name) as ModelBuffers;
    }

    if (modelDataStore.has(name)) {
      const buffers = createModelBuffers(
        gl,
        modelDataStore.get(name) as ModelData
      );
      modelBufferStore.set(name, buffers);
      return buffers;
    }
  }

  if (lineModelBufferStore.has(name)) {
    return lineModelBufferStore.get(name) as LineModelBuffers;
  }

  if (lineModelDataStore.has(name)) {
    const buffers = createLineModelBuffers(
      gl,
      lineModelDataStore.get(name) as LineModelData
    );
    lineModelBufferStore.set(name, buffers);
    return buffers;
  }

  // If we haven't got a line model, try and create one from the tri model.
  if (modelDataStore.has(name)) {
    const lineModel = convertToLineModel(modelDataStore.get(name) as ModelData);
    lineModelDataStore.set(name, lineModel);
    const buffers = createLineModelBuffers(gl, lineModel);
    lineModelBufferStore.set(name, buffers);
    return buffers;
  }

  throw new Error(`Cannot find any model with name "${name}"`);
}

function createModelBuffers(
  gl: WebGLRenderingContext,
  { position, color, index, normal }: ModelData
): ModelBuffers {
  return {
    position: createArrayBuffer(gl, gl.ARRAY_BUFFER, position),
    color: createArrayBuffer(gl, gl.ARRAY_BUFFER, color),
    index: createArrayBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, index),
    normal: createArrayBuffer(gl, gl.ARRAY_BUFFER, normal),
    kind: "tri",
    count: index.length,
  };
}

function createLineModelBuffers(
  gl: WebGLRenderingContext,
  { position, color, index }: LineModelData
): LineModelBuffers {
  return {
    position: createArrayBuffer(gl, gl.ARRAY_BUFFER, position),
    color: createArrayBuffer(gl, gl.ARRAY_BUFFER, color),
    index: createArrayBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, index),
    kind: "line",
    count: index.length,
  };
}

function createArrayBuffer(
  gl: WebGLRenderingContext,
  target: number,
  values: BufferSource
): WebGLBuffer {
  const buffer = gl.createBuffer();

  if (buffer == null) {
    throw new Error("Unable to create buffer");
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, values, gl.STATIC_DRAW);
  return buffer;
}

function convertToLineModel({
  position,
  color,
  index,
}: ModelData): LineModelData {
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
