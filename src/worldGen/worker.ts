import { WorldGenMessage, CreateWorld } from "./message";

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
  context.postMessage(message);
}

function createWorld(message: CreateWorld) {
  send({ kind: "status", message: "Started " + JSON.stringify(message) });
  setTimeout(() => send({ kind: "status", message: "working..." }), 10);
}
