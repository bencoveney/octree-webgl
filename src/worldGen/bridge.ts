import Worker from "worker-loader!./worker";

const worker = new Worker();

function receiveMessage(event: MessageEvent): void {
  console.log("bridge received", event.data);
}
worker.addEventListener("message", receiveMessage);

function send(message: any): void {
  console.log("bridge sending", message);
  worker.postMessage(message);
}

send({ a: 1 });
