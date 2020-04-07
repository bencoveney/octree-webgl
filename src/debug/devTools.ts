import "./devTools.scss";

let devTools: HTMLDivElement;

export function initDevTools(): void {
  devTools = document.createElement("div");

  devTools.setAttribute("id", "devtools");

  document.body.appendChild(devTools);
}

let lastText: string = "";

export function setDevToolsText(text: string): void {
  if (text != lastText) {
    devTools.innerText = text;
    lastText = text;
  }
}
