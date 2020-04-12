import * as Position from "./position";
import * as SceneGraph from "./sceneGraph";
import { vec3 } from "gl-matrix";
import { Entity } from "./entity";
import { collisionCheck } from "./collision";
import * as EntityFactories from "./entityFactories";
import { isKeyDown } from "./keyHandler";
import { getMovement } from "./mouseHandler";
import * as Chunks from "./chunks";
import * as WorldGen from "./worldGen/bridge";

export type World = {
  sceneGraph: SceneGraph.SceneGraphNode;
  camera: SceneGraph.SceneGraphNode;
  entities: Entity[];
  chunks: Chunks.Chunks;
  ambientLightColor: vec3;
  directionalLightColor: vec3;
  directionalLightDirection: vec3;
};

export function create(
  sceneGraph: SceneGraph.SceneGraphNode,
  cameraPosition: Position.Position,
  ambientLightColor: vec3,
  directionalLightColor: vec3,
  directionalLightDirection: vec3,
  entities: Entity[],
  chunks: Chunks.Chunks
): World {
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
    chunks,
  };
}

export async function setUpWorld(gl: WebGL2RenderingContext): Promise<World> {
  const resolution = 64;
  const size = 6;

  const entities = EntityFactories.center(resolution * (size / 2));

  const chunks = await WorldGen.createWorld(gl, resolution, size);

  const sceneGraph = SceneGraph.init();
  Chunks.addToWorld(chunks, sceneGraph);

  const world = create(
    sceneGraph,
    // TODO: Camera position should be a child of the entity.
    Position.create([0, 0, resolution * size]),
    [0.3, 0.3, 0.3],
    [1, 1, 1],
    [0.85, 0.8, 0.75],
    entities,
    chunks
  );

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");

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
    if (entity.isGrounded) {
      vec3.add(desiredSpeed, desiredSpeed, speedDelta);
    } else {
      desiredSpeed[1] += GRAVITY;
    }
    collisionCheck(world, entity, desiredSpeed);
  });

  const mouseInput = getMovement();

  world.camera.position.rotation[1] -= mouseInput[0] / 400;
  world.camera.position.rotation[0] = Math.max(
    Math.min(
      world.camera.position.rotation[0] - mouseInput[1] / 200,
      Math.PI / 2
    ),
    -Math.PI / 2
  );

  vec3.copy(
    world.camera.position.position,
    world.entities[0].position.position
  );
  vec3.add(
    world.camera.position.position,
    world.camera.position.position,
    vec3.fromValues(0, 2, 0)
  );
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
