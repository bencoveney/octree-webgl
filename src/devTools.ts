import "./devTools.scss";

let devTools: HTMLDivElement;

export function initDevTools(): void {
  devTools = document.createElement("div");

  devTools.setAttribute("id", "devtools");

  document.body.appendChild(devTools);
}

export function setDevToolsText(text: string): void {
  devTools.innerText = text;
}
