type LineModel<T> = {
  position: T;
  color: T;
  index: T;
  count: number;
};

export type LineModelData = LineModel<number[]>;
export type LineModelBuffers = LineModel<WebGLBuffer>;

export function createModelBuffers(
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
