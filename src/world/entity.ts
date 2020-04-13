import { vec3 } from "gl-matrix";
import { Position } from "./position";

export type Entity = {
  position: Position;
  speed: vec3;
  width: number;
  height: number;
  model: string;
  isGrounded: boolean;
};
