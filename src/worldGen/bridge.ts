import Worker from "worker-loader!./worker";
import { WorldGenMessage, CreateWorld } from "./message";
import { ModelData } from "../render/modelStore";

export function createWorld(
  // How many voxels along each axis of the chunk.
  resolution: number,
  // The number of chunks along each axis. Total resulting chunks will be size ^3.
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
