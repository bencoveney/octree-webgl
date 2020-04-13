import { vec2 } from "gl-matrix";

let isLocked = false;
let movement = vec2.create();

export function setUpMouseHandler(canvas: HTMLCanvasElement) {
  canvas.addEventListener("click", () => {
    if (isLocked) {
      return;
    }

    canvas.requestPointerLock();
  });

  function testIfLocked() {
    isLocked = document.pointerLockElement === canvas;
  }

  document.addEventListener("pointerlockchange", testIfLocked);
  testIfLocked();

  document.addEventListener("mousemove", (event) => {
    if (!isLocked) {
      return;
    }

    movement[0] = event.movementX;
    movement[1] = event.movementY;
  });
}

export function getMovement() {
  const result = vec2.clone(movement);
  vec2.zero(movement);
  return result;
}
