import { ModelData } from "../render/modelStore";

export type CreateWorld = {
  kind: "createWorld";
  // How many voxels along each axis of the chunk.
  resolution: number;
  // The number of chunks along each axis. Total resulting chunks will be size ^3.
  size: number;
};

export type WorldCreated = {
  kind: "worldCreated";
  voxels: ArrayBuffer;
};

export type ModelCreated = {
  kind: "modelCreated";
  name: string;
  model: ModelData;
};

export type Status = {
  kind: "status";
  message: string;
};

export type WorldGenMessage =
  | CreateWorld
  | WorldCreated
  | ModelCreated
  | Status;
