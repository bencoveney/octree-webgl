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
    scale: [1, 1, 1],
  };
}

export function create(position: vec3, scale: vec3 = [1, 1, 1]): Position {
  return {
    position,
    rotation: [0, 0, 0],
    scale,
  };
}

export function toMatrix(
  target: mat4,
  { position, rotation, scale }: Position
): void {
  mat4.translate(target, target, position);

  const [x, y, z] = rotation;
  // Ordered this way just to support camera rotation.
  if (y) {
    mat4.rotateY(target, target, y);
  }
  if (x) {
    mat4.rotateX(target, target, x);
  }
  if (z) {
    mat4.rotateZ(target, target, z);
  }

  if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
    mat4.scale(target, target, scale);
  }
}
