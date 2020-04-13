import Worker from "worker-loader!./worker";
import { WorldGenMessage, CreateWorld } from "./message";
import { TriGeometry } from "../render/modelStore";
import * as Chunks from "../world/chunks";
import * as ModelStore from "../render/modelStore";
import {
  setLoadingScreenText,
  setLoadingScreenCanvas,
} from "../loading/loadingScreen";
import { reconstructWorld } from "./reconstructWorld";

export function createWorld(
  gl: WebGL2RenderingContext,
  // How many voxels along each axis of the chunk.
  resolution: number,
  // The number of chunks along each axis. Total resulting chunks will be size ^3.
  size: number
): Promise<Chunks.Chunks> {
  return new Promise((resolve) => {
    dispatchToWorker(
      resolution,
      size,
      (message) => setLoadingScreenText("Loading: " + message),
      (message, axisSize, heightmap) =>
        setLoadingScreenCanvas(message, axisSize, heightmap),
      (name, model) => ModelStore.storeModel(gl, name, model),
      (voxels) => {
        resolve(reconstructWorld(resolution, size, voxels));
      }
    );
  });
}

function dispatchToWorker(
  resolution: number,
  size: number,
  onStatus: (message: string) => void,
  onMapUpdated: (
    message: string,
    axisSize: number,
    heightmap: Float32Array
  ) => void,
  onModelCreated: (name: string, model: TriGeometry) => void,
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
      case "mapUpdated":
        onMapUpdated(message.message, message.axisSize, message.heightmap);
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
