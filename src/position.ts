import { vec3, mat4 } from "gl-matrix";

export interface Position {
  position: vec3;
  rotation: vec3;
  scale: number;
}

export function init(): Position {
  return {
    position: vec3.create(),
    rotation: vec3.create(),
    scale: 1
  };
}

export function create(
  x: number,
  y: number,
  z: number,
  scale: number
): Position {
  return {
    position: vec3.fromValues(x, y, z),
    rotation: vec3.create(),
    scale
  };
}

export function toMatrix({ position, rotation, scale }: Position): mat4 {
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, position);

  const [x, y, z] = rotation;
  if (x) {
    mat4.rotateX(matrix, matrix, x);
  }
  if (y) {
    mat4.rotateY(matrix, matrix, y);
  }
  if (z) {
    mat4.rotateZ(matrix, matrix, z);
  }

  if (scale) {
    mat4.scale(matrix, matrix, vec3.fromValues(scale, scale, scale));
  }

  return matrix;
}
