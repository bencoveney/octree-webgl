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
    let color: Color = Color.COLOR_0;

    if (height < 0.25) {
      material = Material.MATERIAL_1;
      color = Color.COLOR_1;
    } else if (height < 0.5) {
      material = Material.MATERIAL_2;
      color = Color.COLOR_2;
    } else {
      material = Material.MATERIAL_3;
      color = Color.COLOR_3;
    }

    const voxel = create(material, color);

    terrain.set(x, y, voxel);
  });

  forEach2d(rivers, (river, x, y) => {
    let riverWidth = Math.floor(river - 100);
    if (riverWidth < 0) {
      return;
    }

    const scaledWidth = Math.ceil(riverWidth / 50);

    let material: Material = Material.MATERIAL_4;
    let color: Color = Color.COLOR_4;

    const voxel = create(material, color);

    terrain.set(x, y, voxel);

    for (let xOffset = 0; xOffset < scaledWidth; xOffset++) {
      for (let yOffset = 0; yOffset < scaledWidth; yOffset++) {
        terrain.set(x - xOffset, y - yOffset, voxel);
        terrain.set(x + xOffset, y - yOffset, voxel);
        terrain.set(x - xOffset, y + yOffset, voxel);
        terrain.set(x + xOffset, y + yOffset, voxel);
      }
    }
  });

  return terrain;
}
