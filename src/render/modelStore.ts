export type ModelKind = "tri" | "line";

type LineModel<T> = {
  position: T;
  color: T;
  index: T;
};

export type LineModelData = LineModel<number[]>;
export type LineModelBuffers = LineModel<WebGLBuffer> & {
  kind: "line";
  count: number;
};

type Model<T> = {
  position: T;
  color: T;
  index: T;
  normal: T;
};

export type ModelData = Model<number[]>;
export type ModelBuffers = Model<WebGLBuffer> & {
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
      return modelBufferStore.get(name);
    }

    if (modelDataStore.has(name)) {
      const buffers = createModelBuffers(gl, modelDataStore.get(name));
      modelBufferStore.set(name, buffers);
      return buffers;
    }
  }

  if (lineModelBufferStore.has(name)) {
    return lineModelBufferStore.get(name);
  }

  if (lineModelDataStore.has(name)) {
    const buffers = createLineModelBuffers(gl, lineModelDataStore.get(name));
    lineModelBufferStore.set(name, buffers);
    return buffers;
  }

  // If we haven't got a line model, try and create one from the tri model.
  if (modelDataStore.has(name)) {
    const lineModel = convertToLineModel(modelDataStore.get(name));
    lineModelDataStore.set(name, lineModel);
    const buffers = createLineModelBuffers(gl, lineModelDataStore.get(name));
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
    position: createArrayBuffer(
      gl,
      gl.ARRAY_BUFFER,
      new Float32Array(position)
    ),
    color: createArrayBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(color)),
    index: createArrayBuffer(
      gl,
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(index)
    ),
    normal: createArrayBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(normal)),
    kind: "tri",
    count: index.length
  };
}

function createLineModelBuffers(
  gl: WebGLRenderingContext,
  { position, color, index }: LineModelData
): LineModelBuffers {
  return {
    position: createArrayBuffer(
      gl,
      gl.ARRAY_BUFFER,
      new Float32Array(position)
    ),
    color: createArrayBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(color)),
    index: createArrayBuffer(
      gl,
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(index)
    ),
    kind: "line",
    count: index.length
  };
}

function createArrayBuffer(
  gl: WebGLRenderingContext,
  target: number,
  values: BufferSource
) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, values, gl.STATIC_DRAW);
  return buffer;
}

function convertToLineModel({
  position,
  color,
  index
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
    index: newIndex
  };
}
