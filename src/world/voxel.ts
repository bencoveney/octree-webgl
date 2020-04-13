/*
  Voxel Data:
  8 bits. 3 bits for material. 5 bits for color.
*/

import { vec4 } from "gl-matrix";

export type Voxel = number;

export enum Color {
  BROWN_0 = 0b00000,
  BROWN_1 = 0b00001,
  BROWN_2 = 0b00010,
  BROWN_3 = 0b00011,
  BROWN_4 = 0b00100,
  BROWN_5 = 0b00101,
  BROWN_6 = 0b00110,
  GREEN_0 = 0b00111,
  GREEN_1 = 0b01000,
  GREEN_2 = 0b01001,
  GREEN_3 = 0b01010,
  GREY_0 = 0b01011,
  GREY_1 = 0b01100,
  GREY_2 = 0b01101,
  GREY_3 = 0b01110,
  GREY_4 = 0b01111,
  BLUE_0 = 0b10000,
  BLUE_1 = 0b10001,
  BLUE_2 = 0b10010,
  BLUE_3 = 0b10011,
  BLUE_4 = 0b10100,
  PURPLE_0 = 0b10101,
  PURPLE_1 = 0b10110,
  PURPLE_2 = 0b10111,
  PINK_0 = 0b11000,
  PINK_1 = 0b11001,
  YELLOW_0 = 0b11010,
  ORANGE_1 = 0b11011,
  RED_1 = 0b11100,
  RED_2 = 0b11101,
  PURPLE_3 = 0b11110,
  BLUEGREY_0 = 0b11111,
}

export const HEX_PALETTE = [
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
  "4f546b",
];

const rgbaPalette = HEX_PALETTE.map((hex) => {
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
  MATERIAL_7 = 0b111,
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
  return rgbaPalette[color];
}
