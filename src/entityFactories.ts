import { Entity } from "./entity";
import * as Position from "./position";
import { vec3 } from "gl-matrix";

export function corners(size: number): Entity[] {
  const entityOffset = size / 2 - 1;
  return [
    [-entityOffset, -entityOffset],
    [-entityOffset, 0],
    [-entityOffset, entityOffset],
    [0, -entityOffset],
    [0, 0],
    [0, entityOffset],
    [entityOffset, -entityOffset],
    [entityOffset, 0],
    [entityOffset, entityOffset],
  ].map(([x, z]) => ({
    position: Position.create([x, size, z], [1, 2, 1]),
    speed: vec3.create(),
    width: 1,
    height: 2,
    model: "cube",
  }));
}

export function center(size: number): Entity[] {
  return [
    {
      position: Position.create([0, size, 0], [1, 2, 1]),
      speed: vec3.create(),
      width: 1,
      height: 2,
      model: "cube",
    },
  ];
}
