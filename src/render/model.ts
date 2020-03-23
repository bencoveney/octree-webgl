type Model<T> = {
  position: T;
  color: T;
  index: T;
  normal: T;
};

export type ModelData = Model<number[]>;
export type ModelBuffers = Model<WebGLBuffer>;

export function createModelBuffers(
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
    normal: createArrayBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(normal))
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
