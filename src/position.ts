import { vec3, mat4 } from "gl-matrix";

export interface Position {
  position: vec3;
  rotation: vec3;
}

export function createPosition(x, y, z): Position {
  return {
    position: vec3.fromValues(x, y, z),
    rotation: vec3.create()
  };
}

export function createPositionMatrix(cube: Position): mat4 {
  const position = mat4.create();
  mat4.translate(position, position, cube.position);

  const [x, y, z] = cube.rotation;
  if (x) {
    mat4.rotateX(position, position, x);
  }
  if (y) {
    mat4.rotateY(position, position, y);
  }
  if (z) {
    mat4.rotateZ(position, position, z);
  }

  return position;
}
