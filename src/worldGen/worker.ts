import { WorldGenMessage, CreateWorld } from "./message";
import * as Chunks from "../chunks";

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
    default:
      context.postMessage(message);
      break;
  }
}

function createWorld(message: CreateWorld) {
  send({ kind: "status", message: "Generating chunks" });
  const chunks = Chunks.createChunkVoxels(message.resolution, message.size);
  send({ kind: "worldCreated", voxels: chunks });
}
