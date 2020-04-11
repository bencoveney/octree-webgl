import { WorldGenMessage, CreateWorld } from "./message";
import * as Voxels from "../voxels";
import { buildWorldChunks } from "./buildWorldChunks";
import { forEach3d } from "../utils";
import { chunkName } from "../chunks";

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
    default:
      context.postMessage(message);
      break;
  }
}

function createWorld({ size, resolution }: CreateWorld) {
  send({ kind: "status", message: "Generating voxels" });
  const totalChunks = size * size * size;
  const totalVoxelsPerChunk = resolution * resolution * resolution;

  const voxelBuffer = new ArrayBuffer(totalChunks * totalVoxelsPerChunk);
  const chunkVoxels = buildWorldChunks(resolution, size, voxelBuffer);
  forEach3d(chunkVoxels, (voxels, x, y, z) => {
    const name = chunkName(x, y, z);
    send({ kind: "status", message: "Generating mesh " + name });
    const mesh = Voxels.voxelsToMesh(voxels);
    send({ kind: "modelCreated", name, model: mesh });
  });

  send({ kind: "worldCreated", voxels: voxelBuffer });
}
