import { WorldGenMessage, CreateWorld } from "./message";
import { buildWorldChunks } from "./buildWorldChunks";
import { forEach3d } from "../utils";
import { chunkName } from "../chunks";
import { constructVoxelMesh } from "./constructVoxelMesh";
import { createHeightmap, populateHeightmap } from "./heightmap";

const context: Worker = self as any;

function receiveMessage(event: MessageEvent): void {
  const message = event.data as WorldGenMessage;
  switch (message.kind) {
    case "createWorld":
      createWorld(message);
      break;
    default:
      throw new Error("Unexpected message kind");
  }
}
context.addEventListener("message", receiveMessage);

function send(message: WorldGenMessage): void {
  switch (message.kind) {
    case "worldCreated":
      context.postMessage(message, [message.voxels]);
      break;
    case "modelCreated":
      context.postMessage(message, [
        message.model.color.buffer,
        message.model.index.buffer,
        message.model.normal.buffer,
        message.model.position.buffer,
      ]);
      break;
    case "mapUpdated":
      const heightmapCopy = new Float32Array(message.heightmap);
      context.postMessage({ ...message, heightmap: heightmapCopy }, [
        heightmapCopy.buffer,
      ]);
      break;
    default:
      context.postMessage(message);
      break;
  }
}

function createWorld({ size, resolution }: CreateWorld) {
  const axisTotalSize = size * resolution;
  const heightmap = createHeightmap(axisTotalSize);

  send({
    kind: "mapUpdated",
    message: "Creating heightmap",
    axisSize: axisTotalSize,
    heightmap: heightmap.data as Float32Array,
  });

  populateHeightmap(heightmap, 50, [
    { step: 32, amplitude: 0.2 },
    { step: 64, amplitude: 0.4 },
    { step: 128, amplitude: 0.6 },
    { step: 256, amplitude: 0.8 },
    { step: 512, amplitude: 1 },
  ]);

  send({
    kind: "mapUpdated",
    message: "Generating voxels",
    axisSize: axisTotalSize,
    heightmap: heightmap.data as Float32Array,
  });

  const totalChunks = size * size * size;
  const totalVoxelsPerChunk = resolution * resolution * resolution;

  const voxelBuffer = new ArrayBuffer(totalChunks * totalVoxelsPerChunk);
  const chunkVoxels = buildWorldChunks(
    resolution,
    size,
    voxelBuffer,
    heightmap
  );
  forEach3d(chunkVoxels, (_, x, y, z) => {
    const name = chunkName(x, y, z);
    send({ kind: "status", message: "Generating mesh for " + name });
    const mesh = constructVoxelMesh(chunkVoxels, x, y, z);
    if (mesh.index.length > 0) {
      send({ kind: "modelCreated", name, model: mesh });
    }
  });

  send({ kind: "worldCreated", voxels: voxelBuffer });
}
