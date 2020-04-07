import { Entity } from "./entity";
import { Voxels } from "./voxels";
import { World } from "./world";
import { getMaterial, Material } from "./voxel";
import { vec3 } from "gl-matrix";

console.clear();

/*
	Problems:
	- The entityBb for vertical collisions is happening 1 to early,
			probably due to fractional overlap
	- Collisions do not resolve really - entity is "embedded" at high speeds
*/

let lastLog: string = "";
const SPEED_LIMIT = 0.1;

export function collisionCheck(
  { voxels }: World,
  entity: Entity,
  desiredSpeed: vec3
): void {
  const clampedSpeed = vec3.clone(desiredSpeed);

  if (vec3.length(clampedSpeed) > SPEED_LIMIT) {
    vec3.normalize(clampedSpeed, clampedSpeed);
    vec3.scale(clampedSpeed, clampedSpeed, SPEED_LIMIT);
  }

  const desiredPosition = vec3.clone(entity.position.position);
  vec3.add(desiredPosition, desiredPosition, clampedSpeed);

  const entityBb = getEntityBoundingBox(entity);
  const clampedBb = clampBoundingBox(entityBb);
  const voxelsBb = getVoxelsBoundingBox(voxels);
  const isColliding = isBoundingBoxColliding(clampedBb, voxelsBb);
  if (isColliding) {
    const voxelCollisionPoints = getVoxelsCollision(clampedBb, voxels);

    let movingPositiveX: boolean = desiredSpeed[0] > 0;
    let movingPositiveY: boolean = desiredSpeed[1] > 0;
    let movingPositiveZ: boolean = desiredSpeed[2] > 0;

    let isCollidingX: boolean = false;
    let isCollidingY: boolean = false;
    let isCollidingZ: boolean = false;

    for (const collisionPoint of voxelCollisionPoints) {
      // TODO: See if resolving individual collisions would fix anything to support sliding.

      if (!movingPositiveY && collisionPoint[1] <= clampedBb.yMin) {
        isCollidingY = true;
        clampedSpeed[1] = 0;
        desiredPosition[1] = entity.position.position[1];
      }
      if (movingPositiveY && collisionPoint[1] >= clampedBb.yMax - 1) {
        isCollidingY = true;
        clampedSpeed[1] = 0;
        desiredPosition[1] = entity.position.position[1];
      }
      if (!movingPositiveX && collisionPoint[0] <= clampedBb.xMin) {
        isCollidingX = true;
        clampedSpeed[0] = 0;
        desiredPosition[0] = entity.position.position[0];
      }
      if (movingPositiveX && collisionPoint[0] >= clampedBb.xMax - 1) {
        isCollidingX = true;
        clampedSpeed[0] = 0;
        desiredPosition[0] = entity.position.position[0];
      }
      if (!movingPositiveZ && collisionPoint[2] <= clampedBb.zMin) {
        isCollidingZ = true;
        clampedSpeed[2] = 0;
        desiredPosition[2] = entity.position.position[2];
      }
      if (movingPositiveZ && collisionPoint[2] >= clampedBb.zMax - 1) {
        isCollidingZ = true;
        clampedSpeed[2] = 0;
        desiredPosition[2] = entity.position.position[2];
      }
    }
    const unknownCollision = !isCollidingX && !isCollidingY && !isCollidingZ;
    const nextLog = `X:${isCollidingX} Y:${isCollidingY} Z:${isCollidingZ} ?:${unknownCollision}`;
    if (nextLog !== lastLog) {
      console.log(nextLog);
      lastLog = nextLog;
    }
  }

  entity.speed = clampedSpeed;
  entity.position.position = desiredPosition;
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
    xMin: basePosition[0] - halfSize,
    xMax: basePosition[0] + halfSize,
    yMin: basePosition[1] - halfHeight,
    yMax: basePosition[1] + halfHeight,
    zMin: basePosition[2] - halfSize,
    zMax: basePosition[2] + halfSize,
  };
}

function clampBoundingBox(boundingBox: BoundingBox): BoundingBox {
  return {
    xMin: Math.floor(boundingBox.xMin),
    xMax: Math.ceil(boundingBox.xMax),
    yMin: Math.floor(boundingBox.yMin),
    yMax: Math.ceil(boundingBox.yMax),
    zMin: Math.floor(boundingBox.zMin),
    zMax: Math.ceil(boundingBox.zMax),
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
    zMax: halfSizeZ,
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

type CollidingVoxel = [number, number, number];

function getVoxelsCollision(
  entityBoundingBox: BoundingBox,
  voxels: Voxels
): CollidingVoxel[] {
  const voxelsSize = voxels.shape[0];
  const voxelOffset = voxelsSize / 2;

  const colliding: CollidingVoxel[] = [];

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
