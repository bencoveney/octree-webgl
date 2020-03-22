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
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(index),
    gl.STATIC_DRAW
  );

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    index: indexBuffer,
    normal: normalBuffer
  };
}
