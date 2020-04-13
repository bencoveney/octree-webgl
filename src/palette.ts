import "./palette.scss";
import { Color, HEX_PALETTE } from "./world/voxel";

Object.keys(Color)
  .filter((color) => "" + parseInt(color) === color)
  .forEach((color) => {
    const div = document.createElement("div");
    const index = parseInt(color);
    const hex = "#" + HEX_PALETTE[index];
    div.style.backgroundColor = hex;
    div.style.width = "160px";
    div.style.height = "160px";
    div.style.padding = "20px";
    div.style.float = "left";
    function addLabel(labelColor: string) {
      const label = document.createElement("span");
      label.innerText = `NAME: ${Color[index]}
HEX: ${hex}`;
      label.style.color = labelColor;
      label.style.display = "block";
      div.appendChild(label);
    }
    addLabel("white");
    addLabel("black");
    document.body.appendChild(div);
  });
