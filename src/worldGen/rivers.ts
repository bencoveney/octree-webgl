import { Heightmap } from "./heightmap";
import { createNdarrayOfSameSize } from "../utils";
import ndarray from "ndarray";

type Gradient = {
  gradientX: number;
  gradientY: number;
};

type Flowmap = ndarray<number>;

export function createRivers(heightmap: Heightmap): Flowmap {
  const flowmap: Flowmap = createNdarrayOfSameSize(
    heightmap,
    (size) => new Uint8Array(size)
  );

  simulateRainfall(heightmap, flowmap);

  // Depending on rainfall, create rivers

  return flowmap;
}

const MAX_DROPLET_LIFETIME = 50;

function simulateRainfall(heightmap: Heightmap, flowmap: Flowmap) {
  for (
    let dropletInitialX = 0;
    dropletInitialX < flowmap.shape[0];
    dropletInitialX++
  ) {
    for (
      let dropletInitialY = 0;
      dropletInitialY < flowmap.shape[0];
      dropletInitialY++
    ) {
      let posX = dropletInitialX;
      let posY = dropletInitialY;

      for (
        let dropletAge = 0;
        dropletAge < MAX_DROPLET_LIFETIME;
        dropletAge++
      ) {
        let { gradientX, gradientY } = calculateGradient(heightmap, posX, posY);

        let len = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        if (len != 0 && len != -0) {
          gradientX /= len;
          gradientY /= len;
        }

        // Stop simulating droplet if it's not moving or has flowed over edge of map
        if (
          (gradientX == 0 && gradientY == 0) ||
          posX < 0 ||
          posX >= heightmap.shape[0] - 1 ||
          posY < 0 ||
          posY >= heightmap.shape[1] - 1
        ) {
          break;
        }

        posX -= gradientX;
        posY -= gradientY;

        const voxelX = Math.floor(posX);
        const voxelY = Math.floor(posY);

        const currentFlow = flowmap.get(voxelX, voxelY) || 0;
        flowmap.set(voxelX, voxelY, currentFlow + 1);
      }
    }
  }
}

function calculateGradient(
  heightmap: Heightmap,
  posX: number,
  posY: number
): Gradient {
  const coordX = Math.floor(posX);
  const coordY = Math.floor(posY);

  const x = Math.floor(posX - coordX);
  const y = Math.floor(posY - coordY);

  // Calculate heights of the four nodes of the droplet's cell
  const heightNW = heightmap.get(coordX, coordY);
  const heightNE = heightmap.get(coordX + 1, coordY);
  const heightSW = heightmap.get(coordX, coordY + 1);
  const heightSE = heightmap.get(coordX + 1, coordY + 1);

  // Calculate droplet's direction of flow with bilinear interpolation of height difference along the edges
  const gradientX = (heightNE - heightNW) * (1 - y) + (heightSE - heightSW) * y;
  const gradientY = (heightSW - heightNW) * (1 - x) + (heightSE - heightNE) * x;

  return { gradientX, gradientY };
}
