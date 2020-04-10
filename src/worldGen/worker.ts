const context: Worker = self as any;

function receiveMessage(event: MessageEvent): void {
  console.log("worker received", event.data);
}
context.addEventListener("message", receiveMessage);

function send(message: any): void {
  console.log("worker sending", message);
  context.postMessage(message);
}
