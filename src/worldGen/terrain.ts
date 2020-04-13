import { Heightmap } from "./heightmap";
import { Flowmap } from "./rivers";
import { createNdarrayOfSameSize, forEach2d } from "../utils";
import { Material, Color, create, Voxel } from "../voxel";
import ndarray from "ndarray";

export type Terrainmap = ndarray<Voxel>;

export function createSurfaceTerrain(
  heightmap: Heightmap,
  rivers: Flowmap
): Terrainmap {
  const terrain: Flowmap = createNdarrayOfSameSize<Voxel>(
    heightmap,
    (size) => new Uint8Array(size)
  );

  forEach2d(heightmap, (height, x, y) => {
    let material: Material = Material.AIR;
    let color: Color = Color.BROWN_0;

    material = Material.MATERIAL_1;

    if (height < 0.1) {
      color = Color.BROWN_5;
    } else if (height < 0.2) {
      color = Color.BROWN_6;
    } else if (height < 0.3) {
      color = Color.GREEN_0;
    } else if (height < 0.4) {
      color = Color.GREEN_1;
    } else if (height < 0.5) {
      color = Color.GREEN_2;
    } else if (height < 0.6) {
      color = Color.GREEN_3;
    } else if (height < 0.7) {
      color = Color.GREY_2;
    } else if (height < 0.8) {
      color = Color.GREY_3;
    } else if (height < 0.9) {
      color = Color.GREY_4;
    } else {
      color = Color.BLUE_0;
    }

    const voxel = create(material, color);

    terrain.set(x, y, voxel);
  });

  const originalHeights = createNdarrayOfSameSize(
    heightmap,
    (_) => new Float32Array(heightmap.data)
  );

  forEach2d(rivers, (river, x, y) => {
    let riverWidth = Math.floor(river - 75);
    if (riverWidth < 0) {
      return;
    }

    let material: Material = Material.MATERIAL_4;
    let color: Color = Color.BLUE_3;

    const voxel = create(material, color);

    terrain.set(x, y, voxel);

    const radius = Math.ceil(riverWidth / 100);

    const height = originalHeights.get(x, y) - 0.02;
    heightmap.set(x, y, height);

    function updateNeighbour(nX: number, nY: number) {
      terrain.set(nX, nY, voxel);
      const radiusHeight = originalHeights.get(nX, nY);
      heightmap.set(nX, nY, Math.min(height, radiusHeight));
    }

    for (let xOffset = 0; xOffset < radius; xOffset++) {
      for (let yOffset = 0; yOffset < radius; yOffset++) {
        if (Math.hypot(xOffset, yOffset) < radius) {
          updateNeighbour(x - xOffset, y - yOffset);
          updateNeighbour(x + xOffset, y - yOffset);
          updateNeighbour(x - xOffset, y + yOffset);
          updateNeighbour(x + xOffset, y + yOffset);
        }
      }
    }
  });

  return terrain;
}
