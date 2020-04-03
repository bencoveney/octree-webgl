import { vec3, mat4 } from "gl-matrix";

export interface Position {
  position: vec3;
  rotation: vec3;
  scale: vec3;
}

export function init(): Position {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  };
}

export function create(position: vec3, scale: vec3 = [1, 1, 1]): Position {
  return {
    position,
    rotation: [0, 0, 0],
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

  if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
    mat4.scale(matrix, matrix, scale);
  }

  return matrix;
}
