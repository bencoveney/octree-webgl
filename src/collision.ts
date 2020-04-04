import { Entity } from "./entity";
import { Voxels } from "./voxels";
import { World } from "./world";
import { getMaterial, Material } from "./voxel";

console.clear();

/*
	Problems:
	- The entityBb for vertical collisions is happening 1 to early,
			probably due to fractional overlap
	- Collisions do not resolve really - entity is "embedded" at high speeds
*/

export function collisionCheck({ voxels }: World, entity: Entity): boolean {
  const entityBb = getEntityBoundingBox(entity);
  const voxelsBb = getVoxelsBoundingBox(voxels);
  const isColliding = isBoundingBoxColliding(entityBb, voxelsBb);
  if (isColliding) {
    const isReallyColliding = getVoxelsCollision(entityBb, voxels);
    return isReallyColliding.length > 0;
  }
  return false;
}

type BoundingBox = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
};

function getEntityBoundingBox(entity: Entity): BoundingBox {
  const basePosition = entity.position.position;
  const halfSize = entity.width;
  const halfHeight = entity.height;

  return {
    xMin: Math.floor(basePosition[0] - halfSize),
    xMax: Math.ceil(basePosition[0] + halfSize),
    yMin: Math.floor(basePosition[1] - halfHeight),
    yMax: Math.ceil(basePosition[1] + halfHeight),
    zMin: Math.floor(basePosition[2] - halfSize),
    zMax: Math.ceil(basePosition[2] + halfSize)
  };
}

function getVoxelsBoundingBox(voxels: Voxels): BoundingBox {
  const halfSizeX = voxels.shape[0] / 2;
  const halfSizeY = voxels.shape[1] / 2;
  const halfSizeZ = voxels.shape[2] / 2;

  return {
    xMin: -halfSizeX,
    xMax: halfSizeX,
    yMin: -halfSizeY,
    yMax: halfSizeY,
    zMin: -halfSizeZ,
    zMax: halfSizeZ
  };
}

function isBoundingBoxColliding(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.xMin <= b.xMax &&
    a.xMax >= b.xMin &&
    a.yMin <= b.yMax &&
    a.yMax >= b.yMin &&
    a.zMin <= b.zMax &&
    a.zMax >= b.zMin
  );
}

function getVoxelsCollision(
  entityBoundingBox: BoundingBox,
  voxels: Voxels
): number[][] {
  const voxelsSize = voxels.shape[0];
  const voxelOffset = voxelsSize / 2;

  const colliding: number[][] = [];

  // For each voxel in "world space"
  // TODO: Optimise by only checking the overlap region?
  for (let x = entityBoundingBox.xMin; x < entityBoundingBox.xMax; x++) {
    // Transform into "voxel space"
    const voxelX = x + voxelOffset;
    // Quit early if the voxel space value would be outside the voxels
    if (voxelX >= voxelsSize || voxelX < 0) {
      continue;
    }
    // Repeat the above for Y and Z co-ords
    for (let y = entityBoundingBox.yMin; y < entityBoundingBox.yMax; y++) {
      const voxelY = y + voxelOffset;
      if (voxelY >= voxelsSize || voxelY < 0) {
        continue;
      }
      for (let z = entityBoundingBox.zMin; z < entityBoundingBox.zMax; z++) {
        const voxelZ = z + voxelOffset;
        if (voxelZ >= voxelsSize || voxelZ < 0) {
          continue;
        }
        // Now that we have a valid location, collide if it isn't air.
        const voxel = voxels.get(voxelX, voxelY, voxelZ);
        const material = getMaterial(voxel);
        if (material === Material.AIR) {
          continue;
        }
        colliding.push([x, y, z]);
      }
    }
  }
  return colliding;
}
