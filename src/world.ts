import * as Position from "./position";
import * as Voxels from "./voxels";
import * as SceneGraph from "./sceneGraph";
import { vec3 } from "gl-matrix";
import * as ModelStore from "./render/modelStore";
import * as Voxel from "./voxel";
import * as Noise from "simplenoise";
import { Entity } from "./entity";
import { collisionCheck } from "./collision";

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
  entities.forEach(entity =>
    SceneGraph.addChild(sceneGraph, entity.position, entity.model)
  );
  return {
    sceneGraph,
    camera,
    ambientLightColor,
    directionalLightColor,
    directionalLightDirection,
    entities,
    voxels
  };
}

export function setUpWorld(): World {
  const depth = 5;
  const size = Math.pow(2, depth);

  const halfSize = size / 2;
  const entities: Entity[] = [
    [-halfSize, -halfSize],
    [-halfSize, 0],
    [-halfSize, halfSize],
    [0, -halfSize],
    [0, 0],
    [0, halfSize],
    [halfSize, -halfSize],
    [halfSize, 0],
    [halfSize, halfSize]
  ].map(([x, z]) => ({
    position: Position.create([x, size * 2, z], [1, 2, 1]),
    speed: vec3.create(),
    width: 2,
    height: 2,
    model: "cube"
  }));

  Noise.seed(Math.random());

  const voxels = Voxels.create(size, (x, y, z) => {
    const color: Voxel.Color = Math.floor((x + y + z) / 5);
    const material =
      Noise.perlin3(x / 10, y / 10, z / 10) > 0.25
        ? Voxel.Material.MATERIAL_1
        : Voxel.Material.AIR;
    return Voxel.create(material, color);
  });
  const faces = Voxels.voxelsToMesh(voxels);
  ModelStore.storeModel("cubegen", faces);

  const world = create(
    Position.create([0, 0, size + depth * 8]),
    [0.3, 0.3, 0.3],
    [1, 1, 1],
    [0.85, 0.8, 0.75],
    entities,
    voxels
  );

  world.sceneGraph.position.rotation[0] = 0.5;

  SceneGraph.addChild(world.sceneGraph, Position.init(), "axis");
  SceneGraph.addChild(world.sceneGraph, Position.init(), "cubegen");

  return world;
}

export function update(
  world: World,
  _deltaTimeMs: number,
  totalTimeMs: number
): void {
  world.sceneGraph.position.rotation[1] = -totalTimeMs / 4000;

  const theVoid = -100;

  world.entities.forEach(entity => {
    const isColliding = collisionCheck(world, entity);

    entity.speed[1] -= 0.001;
    vec3.add(entity.position.position, entity.position.position, entity.speed);

    if (isColliding) {
      entity.position.position[1] =
        entity.position.position[1] - entity.speed[1];
      entity.speed[1] = 0;
    } else if (entity.position.position[1] <= theVoid && !isColliding) {
      entity.position.position[1] = theVoid;
      entity.speed[1] = 0;
    }
  });
}
