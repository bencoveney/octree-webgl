import { LineGeometry } from "../modelStore";

const position = [
  // X
  0,
  0,
  0,
  1,
  0,
  0,

  // Y
  0,
  0,
  0,
  0,
  1,
  0,

  // Z
  0,
  0,
  0,
  0,
  0,
  1,
];

const faceColors = [
  [1.0, 0.0, 0.0, 1.0], // x: red
  [0.0, 1.0, 0.0, 1.0], // y: green
  [0.0, 0.0, 1.0, 1.0], // z: blue
];

let color: number[] = [];

for (let j = 0; j < faceColors.length; ++j) {
  const c = faceColors[j];

  color = color.concat(c, c);
}

const index = [0, 1, 2, 3, 4, 5];

export const model: LineGeometry = {
  position: Float32Array.from(position),
  color: Float32Array.from(color),
  index: Uint16Array.from(index),
};
