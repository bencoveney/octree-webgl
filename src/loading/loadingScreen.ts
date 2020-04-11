import "./loadingScreen.scss";

let screenElement: HTMLDivElement | null = null;
let textElement: HTMLDivElement | null;

export function createLoadingScreen() {
  if (screenElement) {
    return;
  }
  screenElement = document.createElement("div");
  screenElement.setAttribute("id", "loading-screen");
  document.body.appendChild(screenElement);

  textElement = document.createElement("div");
  textElement.setAttribute("id", "loading-screen-text");
  screenElement.appendChild(textElement);
}

export function setLoadingScreenText(message: string) {
  if (!textElement) {
    return;
  }
  textElement.innerText = message;
}

export function destroyLoadingScreen() {
  if (!screenElement) {
    return;
  }
  (textElement as HTMLDivElement).remove();
  textElement = null;
  screenElement.remove();
  screenElement = null;
}
