import { listenForPress } from "../input/keyHandler";

export const DEBUG_KEY = "i";

let debug = false;
listenForPress(DEBUG_KEY, () => (debug = !debug));

export function getDebugMode(): boolean {
  return debug;
}
