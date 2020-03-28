let debug = false;

window.addEventListener("keypress", event => {
  if (event.repeat) {
    return;
  }

  if (event.key.toLowerCase() === "d") {
    debug = !debug;
  }
});

export function getDebugMode(): boolean {
  return debug;
}
