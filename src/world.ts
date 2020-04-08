import * as Position from "./position";
import * as Voxels from "./voxels";
import * as SceneGraph from "./sceneGraph";
import { vec3 } from "gl-matrix";
import * as ModelStore from "./render/modelStore";
import { Entity } from "./entity";
import { collisionCheck } from "./collision";
import * as VoxelFactories from "./voxelFactories";
import * as EntityFactories from "./entityFactories";
import { isKeyDown } from "./keyHandler";

export type World = {
  sceneGraph: SceneGraph.SceneGraphNode;
  camera: SceneGraph.SceneGraphNode;
  entities: Entity[];
  voxels: Voxels.Voxels;
  ambientLightColor: vec3;
  directionalLightColor: vec3;
  directionalLightDirection: vec3;
};

export function create(
  cameraPosition: Position.Position,
  ambientLightColor: vec3,
  directionalLightColor: vec3,
  directionalLightDirection: vec3,
  entities: Entity[],
  voxels: Voxels.Voxels
): World {
  const sceneGraph = SceneGraph.init();
  const camera = SceneGraph.addChild(sceneGraph, cameraPosition, null);
  entities.forEach((entity) => {
    const entityNode = SceneGraph.addChild(
      sceneGraph,
      entity.position,
      entity.model
    );
    SceneGraph.addChild(entityNode, Position.init(), "axis");
  });
  return {
    sceneGraph,
    camera,
    ambientLightColor,
    directionalLightColor,
    directionalLightDirection,
    entities,
    voxels,
  };
}

export function setUpWorld(): World {
  const depth = 6;
  const size = Math.pow(2, depth);

  const voxels = Voxels.create(size, VoxelFactories.terrain);
  const faces = Voxels.voxelsToMesh(voxels);
  ModelStore.storeModel("cubegen", faces);

  const entities = EntityFactories.center(size);

  const world = create(
    Position.create([0, 0, size + depth * 8]),
    [0.3, 0.3, 0.3],
    [1, 1, 1],
    [0.85, 0.8, 0.75],
    entities,
    voxels
  );

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");
  SceneGraph.addChild(world.sceneGraph, Position.init(), "cubegen");

  window.addEventListener("mousemove", (event) => {
    world.camera.position.rotation[1] -= event.movementX / 200;
    world.camera.position.rotation[0] = Math.max(
      Math.min(
        world.camera.position.rotation[0] - event.movementY / 100,
        Math.PI / 2
      ),
      -Math.PI / 2
    );
  });

  return world;
}

export function update(
  world: World,
  _deltaTimeMs: number,
  _totalTimeMs: number
): void {
  const speedDelta = getDesiredSpeedDelta();

  vec3.rotateY(
    speedDelta,
    speedDelta,
    vec3.create(),
    world.camera.position.rotation[1]
  );

  world.entities.forEach((entity) => {
    const desiredSpeed = vec3.clone(entity.speed);
    vec3.add(desiredSpeed, desiredSpeed, speedDelta);
    collisionCheck(world, entity, desiredSpeed);
  });

  vec3.copy(
    world.camera.position.position,
    world.entities[0].position.position
  );
  vec3.add(
    world.camera.position.position,
    world.camera.position.position,
    vec3.fromValues(0, 2, 0)
  );
  vec3.copy(world.camera.position.scale, world.entities[0].position.scale);
}

const GRAVITY = -0.001;

function getDesiredSpeedDelta(): vec3 {
  let deltaX = 0;
  if (isKeyDown("a")) {
    deltaX -= 0.1;
  }
  if (isKeyDown("d")) {
    deltaX += 0.1;
  }

  let deltaY = GRAVITY;
  if (isKeyDown(" ")) {
    deltaY += 0.1;
  }

  let deltaZ = 0;
  if (isKeyDown("w")) {
    deltaZ -= 0.1;
  }
  if (isKeyDown("s")) {
    deltaZ += 0.1;
  }

  return vec3.fromValues(deltaX, deltaY, deltaZ);
}
