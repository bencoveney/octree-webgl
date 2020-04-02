/*
  Voxel Data:
  8 bits. 3 bits for material. 5 bits for color.
*/

import { vec4 } from "gl-matrix";

export type Voxel = number;

export const enum Color {
  COLOR_0 = 0b00000,
  COLOR_1 = 0b00001,
  COLOR_2 = 0b00010,
  COLOR_3 = 0b00011,
  COLOR_4 = 0b00100,
  COLOR_5 = 0b00101,
  COLOR_6 = 0b00110,
  COLOR_7 = 0b00111,
  COLOR_8 = 0b01000,
  COLOR_9 = 0b01001,
  COLOR_10 = 0b01010,
  COLOR_11 = 0b01011,
  COLOR_12 = 0b01100,
  COLOR_13 = 0b01101,
  COLOR_14 = 0b01110,
  COLOR_15 = 0b01111,
  COLOR_16 = 0b10000,
  COLOR_17 = 0b10001,
  COLOR_18 = 0b10010,
  COLOR_19 = 0b10011,
  COLOR_20 = 0b10100,
  COLOR_21 = 0b10101,
  COLOR_22 = 0b10110,
  COLOR_23 = 0b10111,
  COLOR_24 = 0b11000,
  COLOR_25 = 0b11001,
  COLOR_26 = 0b11010,
  COLOR_27 = 0b11011,
  COLOR_28 = 0b11100,
  COLOR_29 = 0b11101,
  COLOR_30 = 0b11110,
  COLOR_31 = 0b11111
}

const palette = [
  "472d3c",
  "5e3643",
  "7a444a",
  "a05b53",
  "bf7958",
  "eea160",
  "f4cca1",
  "b6d53c",
  "71aa34",
  "397b44",
  "3c5956",
  "302c2e",
  "5a5353",
  "7d7071",
  "a0938e",
  "cfc6b8",
  "dff6f5",
  "8aebf1",
  "28ccdf",
  "3978a8",
  "394778",
  "39314b",
  "564064",
  "8e478c",
  "cd6093",
  "ffaeb6",
  "f4b41b",
  "f47e1b",
  "e6482e",
  "a93b3b",
  "827094",
  "4f546b"
].map(hex => {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return vec4.fromValues(r / 255, g / 255, b / 255, 1);
});

export const enum Material {
  AIR = 0b000,
  MATERIAL_1 = 0b001,
  MATERIAL_2 = 0b010,
  MATERIAL_3 = 0b011,
  MATERIAL_4 = 0b100,
  MATERIAL_5 = 0b101,
  MATERIAL_6 = 0b110,
  MATERIAL_7 = 0b111
}

export function create(material: Material, color: Color): number {
  return ((material & 7) << 5) + (color & 31);
}

export function getMaterial(voxel: number): Material {
  // Shift off the right-most 5 bits, leaving the left-most 3.
  return voxel >> 5;
}

export function getColor(voxel: number): Color {
  // Take the right-most 5 bits.
  return voxel & 31;
}

export function getRgba(color: Color) {
  return palette[color];
}
