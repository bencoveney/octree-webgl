import { VoxelFactory } from "./voxels";
import * as Voxel from "./voxel";
import * as Noise from "simplenoise";
import { vec3 } from "gl-matrix";

Noise.seed(Math.random());

export const noise: VoxelFactory = (x, y, z) => {
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  const material =
    Noise.perlin3(x / 10, y / 10, z / 10) > 0.25
      ? Voxel.Material.MATERIAL_1
      : Voxel.Material.AIR;
  return Voxel.create(material, color);
};

export const circle: (halfSize: number) => VoxelFactory = halfSize => (
  x,
  y,
  z
) => {
  const distance = vec3.distance([x, y, z], [halfSize, halfSize, halfSize]);
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  if (distance < halfSize) {
    return Voxel.create(Voxel.Material.MATERIAL_1, color);
  }
  return Voxel.create(Voxel.Material.AIR, color);
};

export const fill: VoxelFactory = (x, y, z) => {
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  return Voxel.create(Voxel.Material.MATERIAL_1, color);
};

export const axis: VoxelFactory = (x, y, z) => {
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  if (x + y === 0 || y + z === 0 || z + x === 0) {
    return Voxel.create(Voxel.Material.MATERIAL_1, color);
  }
  return Voxel.create(Voxel.Material.AIR, color);
};

export const slope: VoxelFactory = (x, y, z) => {
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  // TODO: Assumes size is 2^3
  if (x + y + z < 8) {
    return Voxel.create(Voxel.Material.MATERIAL_1, color);
  }
  return Voxel.create(Voxel.Material.AIR, color);
};

export const almostFill: VoxelFactory = (x, y, z) => {
  const color: Voxel.Color = Math.floor((x + y + z) / 5);
  // TODO: Assumes size is 2^3
  if (x > 0 && y > 0 && z > 0 && x < 7 && y < 7 && z < 7) {
    return Voxel.create(Voxel.Material.MATERIAL_1, color);
  }
  return Voxel.create(Voxel.Material.AIR, color);
};
