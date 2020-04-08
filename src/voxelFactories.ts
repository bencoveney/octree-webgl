import { VoxelFactory } from "./voxels";
import * as Voxel from "./voxel";
import * as Noise from "simplenoise";
import { vec3 } from "gl-matrix";

Noise.seed(Math.random());

function diagonalColor(x: number, y: number, z: number): Voxel.Color {
  return Math.floor((x + y + z) / 5);
}

function heightColor(_x: number, y: number, _z: number): Voxel.Color {
  return Math.floor(y / 3) % 32;
}

export const noise: VoxelFactory = (x, y, z) => {
  const material =
    Noise.perlin3(x / 10, y / 10, z / 10) < -0.25
      ? Voxel.Material.MATERIAL_1
      : Voxel.Material.AIR;
  return Voxel.create(material, diagonalColor(x, y, z));
};

export const terrain: VoxelFactory = (x, y, z, _size, halfSize) => {
  const density = Noise.perlin3(x / 100, y / 100, z / 100);
  const height = y - halfSize;
  const adjustedDensity = density - height / halfSize;
  const material =
    adjustedDensity >= 0 ? Voxel.Material.MATERIAL_1 : Voxel.Material.AIR;
  return Voxel.create(material, heightColor(x, y, z));
};

export const positionedTerrain: (
  offsetX: number,
  offsetY: number,
  offsetZ: number
) => VoxelFactory = (offsetX, offsetY, offsetZ) => (
  x,
  y,
  z,
  _size,
  halfSize
) => {
  const actualX = offsetX + x;
  const actualY = offsetY + y;
  const actualZ = offsetZ + z;
  const density = Noise.perlin3(actualX / 100, actualY / 100, actualZ / 100);
  const height = actualY - halfSize;
  const adjustedDensity = density - height / halfSize;
  const material =
    adjustedDensity >= 0 ? Voxel.Material.MATERIAL_1 : Voxel.Material.AIR;
  return Voxel.create(material, heightColor(actualX, actualY, actualZ));
};

export const circle: VoxelFactory = (x, y, z, _size, halfSize) => {
  const distance = vec3.distance([x, y, z], [halfSize, halfSize, halfSize]);
  if (distance < halfSize) {
    return Voxel.create(Voxel.Material.MATERIAL_1, diagonalColor(x, y, z));
  }
  return Voxel.create(Voxel.Material.AIR, diagonalColor(x, y, z));
};

export const fill: VoxelFactory = (x, y, z) => {
  return Voxel.create(Voxel.Material.MATERIAL_1, diagonalColor(x, y, z));
};

export const axis: VoxelFactory = (x, y, z) => {
  if (x + y === 0 || y + z === 0 || z + x === 0) {
    return Voxel.create(Voxel.Material.MATERIAL_1, diagonalColor(x, y, z));
  }
  return Voxel.create(Voxel.Material.AIR, diagonalColor(x, y, z));
};

export const slope: VoxelFactory = (x, y, z, size) => {
  if (x + y + z < size) {
    return Voxel.create(Voxel.Material.MATERIAL_1, diagonalColor(x, y, z));
  }
  return Voxel.create(Voxel.Material.AIR, diagonalColor(x, y, z));
};

export const almostFill: VoxelFactory = (x, y, z, size) => {
  if (x > 0 && y > 0 && z > 0 && x < size - 1 && y < size - 1 && z < size - 1) {
    return Voxel.create(Voxel.Material.MATERIAL_1, diagonalColor(x, y, z));
  }
  return Voxel.create(Voxel.Material.AIR, diagonalColor(x, y, z));
};
