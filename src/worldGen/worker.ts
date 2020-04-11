import { WorldGenMessage, CreateWorld } from "./message";
import * as Voxels from "../voxels";
import { buildWorldChunks } from "./buildWorldChunks";

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

function createWorld(message: CreateWorld) {
  send({ kind: "status", message: "Generating chunks" });
  const chunks = buildWorldChunks(
    message.resolution,
    message.size,
    (voxels, name) =>
      send({ kind: "modelCreated", name, model: Voxels.voxelsToMesh(voxels) })
  );
  send({ kind: "worldCreated", voxels: chunks });
}
