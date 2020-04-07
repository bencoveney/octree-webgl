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
const SPEED_LIMIT = 0.5;

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
  const voxelsBb = getVoxelsBoundingBox(voxels);
  const isColliding = isBoundingBoxColliding(entityBb, voxelsBb);
  if (isColliding) {
    const voxelCollisionPoints = getVoxelsCollision(entityBb, voxels);

    let movingPositiveX: boolean = desiredSpeed[0] > 0;
    let movingPositiveY: boolean = desiredSpeed[1] > 0;
    let movingPositiveZ: boolean = desiredSpeed[2] > 0;

    let isCollidingX: boolean = false;
    let isCollidingY: boolean = false;
    let isCollidingZ: boolean = false;

    for (const collisionPoint of voxelCollisionPoints) {
      // TODO: See if resolving individual collisions would fix anything to support sliding.

      if (
        !movingPositiveY &&
        isCollidingNegativeY(entity, entity.position.position, collisionPoint)
      ) {
        if (getVoxelsCollision(entityBb, voxels)) isCollidingY = true;
        clampedSpeed[1] = 0;
        desiredPosition[1] = entity.position.position[1];
      }
      if (
        movingPositiveY &&
        isCollidingPositiveY(entity, entity.position.position, collisionPoint)
      ) {
        isCollidingY = true;
        clampedSpeed[1] = 0;

        desiredPosition[1] = entity.position.position[1];
      }
      if (
        !movingPositiveX &&
        isCollidingNegativeX(entity, entity.position.position, collisionPoint)
      ) {
        isCollidingX = true;
        clampedSpeed[0] = 0;
        desiredPosition[0] = entity.position.position[0];
      }
      if (
        movingPositiveX &&
        isCollidingPositiveX(entity, entity.position.position, collisionPoint)
      ) {
        isCollidingX = true;
        clampedSpeed[0] = 0;
        desiredPosition[0] = entity.position.position[0];
      }
      if (
        !movingPositiveZ &&
        isCollidingNegativeZ(entity, entity.position.position, collisionPoint)
      ) {
        isCollidingZ = true;
        clampedSpeed[2] = 0;
        desiredPosition[2] = entity.position.position[2];
      }
      if (
        movingPositiveZ &&
        isCollidingPositiveZ(entity, entity.position.position, collisionPoint)
      ) {
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
    xMin: Math.floor(basePosition[0] - halfSize),
    xMax: Math.ceil(basePosition[0] + halfSize),
    yMin: Math.floor(basePosition[1] - halfHeight),
    yMax: Math.ceil(basePosition[1] + halfHeight),
    zMin: Math.floor(basePosition[2] - halfSize),
    zMax: Math.ceil(basePosition[2] + halfSize),
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

function isCollidingNegativeX(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const edge = position[0] - entity.width / 2;
  return collisionPoint[0] < edge;
}

function isCollidingPositiveX(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const edge = position[0] + entity.width / 2 - 1;
  return collisionPoint[0] > edge;
}

function isCollidingNegativeY(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const entityBottom = position[1] - entity.height;
  return collisionPoint[1] < entityBottom;
}

// Untested
function isCollidingPositiveY(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const entityBottom = position[1] + entity.height / 2 - 1;
  return collisionPoint[1] > entityBottom;
}

function isCollidingNegativeZ(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const edge = position[2] - entity.width / 2;
  return collisionPoint[2] < edge;
}

function isCollidingPositiveZ(
  entity: Entity,
  position: vec3,
  collisionPoint: CollidingVoxel
): boolean {
  const edge = position[2] + entity.width / 2 - 1;
  return collisionPoint[2] > edge;
}
