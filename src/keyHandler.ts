export function listenForPress(key: string, callback: () => void) {
  window.addEventListener("keypress", (event) => {
    if (event.key.toLowerCase() === key.toLowerCase()) {
      callback();
    }
  });
}

const listenedKeys = new Map<string, boolean>();

window.addEventListener("keydown", (event) =>
  listenedKeys.set(event.key.toLowerCase(), true)
);
window.addEventListener("keyup", (event) =>
  listenedKeys.set(event.key.toLowerCase(), false)
);

export function isKeyDown(key: string): boolean {
  return (
    listenedKeys.has(key.toLowerCase()) &&
    (listenedKeys.get(key.toLowerCase()) as boolean)
  );
}
