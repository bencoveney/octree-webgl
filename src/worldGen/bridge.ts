import Worker from "worker-loader!./worker";
import { WorldGenMessage, CreateWorld } from "./message";
import { ModelData } from "../render/modelStore";
import * as Chunks from "../chunks";

export function createVoxels(
  // How many voxels along each axis of the chunk.
  resolution: number,
  // The number of chunks along each axis. Total resulting chunks will be size ^3.
  size: number
): Promise<Chunks.Chunks> {
  return new Promise((resolve) => {
    createWorld(
      resolution,
      size,
      (message) => console.log("Got message: " + message),
      (name) => console.log("Got model: " + name),
      (voxels) => {
        resolve(Chunks.createChunks(resolution, size, voxels));
      }
    );
  });
}

function createWorld(
  resolution: number,
  size: number,
  onStatus: (message: string) => void,
  onModelCreated: (name: string, model: ModelData) => void,
  onWorldCreated: (voxels: ArrayBuffer) => void
): void {
  const worker = new Worker();

  worker.addEventListener("message", (event: MessageEvent) => {
    const message = event.data as WorldGenMessage;
    switch (message.kind) {
      case "status":
        onStatus(message.message);
        break;
      case "worldCreated":
        onWorldCreated(message.voxels);
        worker.terminate();
        break;
      case "modelCreated":
        onModelCreated(message.name, message.model);
        break;
      default:
        throw new Error("Unexpected message kind");
    }
  });

  const createWorld: CreateWorld = {
    kind: "createWorld",
    resolution,
    size,
  };

  worker.postMessage(createWorld);
}
