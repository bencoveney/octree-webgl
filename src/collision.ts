import { Entity } from "./entity";
import { World } from "./world";
import { getMaterial, Material } from "./voxel";
import { vec3 } from "gl-matrix";
import * as Chunks from "./chunks";

const SPEED_LIMIT = 0.1;

// The order in which to "undo" movement when resolving collisions.
// Resolve vertical collisions first as walking on the floor will be the most common.
// Prefer less dimensions to allow sliding along other dimensions.
const collisionResolutionOrder = [[1], [0], [2], [0, 1], [1, 2], [0, 2]];

export function collisionCheck(
  { chunks }: World,
  entity: Entity,
  desiredSpeed: vec3
): void {
  // Assume we're in the air now, unless a collision tells us otherwise.
  entity.isGrounded = false;

  const clampedSpeed = vec3.clone(desiredSpeed);

  // Limit speed horizontally. The player shouldn't be able to run as fast as they like, but they
  // should be able to fall as fast as they like.
  const horizontalSpeed = Math.hypot(clampedSpeed[0], clampedSpeed[2]);
  if (horizontalSpeed > SPEED_LIMIT) {
    const scale = horizontalSpeed / SPEED_LIMIT;
    clampedSpeed[0] = clampedSpeed[0] / scale;
    clampedSpeed[2] = clampedSpeed[2] / scale;
  }

  const desiredPosition = vec3.clone(entity.position.position);
  vec3.add(desiredPosition, desiredPosition, clampedSpeed);

  const entityBb = getEntityBoundingBox(entity, desiredPosition);
  const clampedBb = clampBoundingBox(entityBb);

  // TODO: This could be smarter - we can calculate which chunks collide rather than
  // doing a BB collision on all of them.
  const collidingChunks: Chunks.Chunk[] = [];
  (chunks.data as Chunks.Chunk[]).forEach((chunk) => {
    const chunkBoundingBox = getChunkBoundingBox(chunk);
    // Prefer fast collision check
    const isColliding = isBoundingBoxColliding(clampedBb, chunkBoundingBox);
    if (isColliding) {
      collidingChunks.push(chunk);
    }
  });

  if (collidingChunks.length > 0) {
    // Fall back to slow collision check
    const voxelCollisionPoints = getVoxelsCollisionAcrossChunks(
      clampedBb,
      collidingChunks
    );

    if (voxelCollisionPoints.length !== 0) {
      let movingPositiveX: boolean = desiredSpeed[0] > 0;
      let movingPositiveY: boolean = desiredSpeed[1] > 0;
      let movingPositiveZ: boolean = desiredSpeed[2] > 0;

      // TODO: Does this functionally make any difference?
      const collisionDirections = getCollisionDirections(
        clampedBb,
        movingPositiveX,
        movingPositiveY,
        movingPositiveZ,
        voxelCollisionPoints
      );

      // Reuse these rather than creating new ones for each iteration.
      const revisedSpeed = vec3.create();
      const revisedPosition = vec3.create();

      for (const resolutionAxis of collisionResolutionOrder) {
        // Check whether collision actually happened along this axis.
        let isCollisionInThisAxis = true;
        for (const axis of resolutionAxis) {
          isCollisionInThisAxis =
            isCollisionInThisAxis && collisionDirections[axis];
        }
        if (isCollisionInThisAxis) {
          // Cancel speed along the axis we are testing.
          vec3.copy(revisedSpeed, clampedSpeed);
          for (const axis of resolutionAxis) {
            revisedSpeed[axis] = 0;
          }

          // If we're moving out of the floor, apply friction.
          if (!movingPositiveY && resolutionAxis.indexOf(1) >= 0) {
            revisedSpeed[0] = revisedSpeed[0] / 1.1;
            revisedSpeed[2] = revisedSpeed[2] / 1.1;
          }

          // Re-calculate the possible possition using the new speed calculation
          vec3.copy(revisedPosition, entity.position.position);
          vec3.add(revisedPosition, revisedPosition, revisedSpeed);
          const entityBb = getEntityBoundingBox(entity, revisedPosition);
          const clampedBb = clampBoundingBox(entityBb);

          // Test to see if the collsion has resolved itself.
          const voxelCollisionPoints = getVoxelsCollisionAcrossChunks(
            clampedBb,
            collidingChunks
          );
          if (voxelCollisionPoints.length === 0) {
            // Check if we resolved the collision by moving out of the floor.
            if (!movingPositiveY && resolutionAxis.indexOf(1) >= 0) {
              entity.isGrounded = true;
            }

            // If it has, great!
            entity.speed = revisedSpeed;
            entity.position.position = revisedPosition;

            // Avoid resolving any more collisions.
            return;
          }
        }
      }

      entity.speed = vec3.create();
      return;
    }
  }

  entity.speed = clampedSpeed;
  entity.position.position = desiredPosition;
}

export type BoundingBox = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
};

function getEntityBoundingBox(
  entity: Entity,
  position: vec3 = entity.position.position
): BoundingBox {
  const halfSize = entity.width;
  const halfHeight = entity.height;

  return {
    xMin: position[0] - halfSize,
    xMax: position[0] + halfSize,
    yMin: position[1] - halfHeight,
    yMax: position[1] + halfHeight,
    zMin: position[2] - halfSize,
    zMax: position[2] + halfSize,
  };
}

function clampBoundingBox(boundingBox: BoundingBox): BoundingBox {
  // Expand a float bounding box so that it fits voxel boundaries.
  return {
    xMin: Math.floor(boundingBox.xMin),
    xMax: Math.ceil(boundingBox.xMax),
    yMin: Math.floor(boundingBox.yMin),
    yMax: Math.ceil(boundingBox.yMax),
    zMin: Math.floor(boundingBox.zMin),
    zMax: Math.ceil(boundingBox.zMax),
  };
}

function getChunkBoundingBox(chunk: Chunks.Chunk): BoundingBox {
  return {
    xMin: chunk.originX,
    xMax: chunk.originX + chunk.size,
    yMin: chunk.originY,
    yMax: chunk.originY + chunk.size,
    zMin: chunk.originZ,
    zMax: chunk.originZ + chunk.size,
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

function getVoxelsCollisionAcrossChunks(
  entityBoundingBox: BoundingBox,
  chunks: Chunks.Chunk[]
): CollidingVoxel[] {
  let result: CollidingVoxel[] = [];
  chunks.forEach(
    (chunk) =>
      (result = result.concat(getVoxelsCollision(entityBoundingBox, chunk)))
  );
  return result;
}

function getVoxelsCollision(
  entityBoundingBox: BoundingBox,
  chunk: Chunks.Chunk
): CollidingVoxel[] {
  const colliding: CollidingVoxel[] = [];

  // For each voxel in "world space"
  for (let x = entityBoundingBox.xMin; x < entityBoundingBox.xMax; x++) {
    // Quit early if the voxel space value would be outside the voxels
    if (x >= chunk.originX + chunk.size || x < chunk.originX) {
      continue;
    }
    // Repeat the above for Y and Z co-ords
    for (let y = entityBoundingBox.yMin; y < entityBoundingBox.yMax; y++) {
      if (y >= chunk.originY + chunk.size || y < chunk.originY) {
        continue;
      }
      for (let z = entityBoundingBox.zMin; z < entityBoundingBox.zMax; z++) {
        if (z >= chunk.originZ + chunk.size || z < chunk.originZ) {
          continue;
        }
        // Now that we have a valid location, collide if it isn't air.
        const voxel = chunk.voxels.get(
          x - chunk.originX,
          y - chunk.originY,
          z - chunk.originZ
        );
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

function getCollisionDirections(
  clampedBoundingBox: BoundingBox,
  movingPositiveX: boolean,
  movingPositiveY: boolean,
  movingPositiveZ: boolean,
  voxelCollisionPoints: CollidingVoxel[]
): boolean[] {
  const result = [false, false, false];

  for (const collisionPoint of voxelCollisionPoints) {
    if (!movingPositiveX && collisionPoint[0] <= clampedBoundingBox.xMin) {
      result[0] = true;
    }
    if (movingPositiveX && collisionPoint[0] >= clampedBoundingBox.xMax - 1) {
      result[0] = true;
    }
    if (!movingPositiveY && collisionPoint[1] <= clampedBoundingBox.yMin) {
      result[1] = true;
    }
    if (movingPositiveY && collisionPoint[1] >= clampedBoundingBox.yMax - 1) {
      result[1] = true;
    }
    if (!movingPositiveZ && collisionPoint[2] <= clampedBoundingBox.zMin) {
      result[2] = true;
    }
    if (movingPositiveZ && collisionPoint[2] >= clampedBoundingBox.zMax - 1) {
      result[2] = true;
    }
  }

  return result;
}
