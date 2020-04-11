import { ModelData } from "../render/modelStore";
import ndarray from "ndarray";
import { Material, Color, getRgba, getMaterial, getColor } from "../voxel";
import { Voxels } from "../voxels";

export function constructVoxelMesh(
  chunkVoxels: ndarray<Voxels>,
  chunkX: number,
  chunkY: number,
  chunkZ: number
): ModelData {
  const voxels = chunkVoxels.get(chunkX, chunkY, chunkZ);

  const result = {
    position: [] as number[],
    color: [] as number[],
    index: [] as number[],
    normal: [] as number[],
  };
  // Assumes all dimensions are the same size.
  const size = voxels.shape[0];

  function runDimension(transpose: [number, number, number]) {
    let transposeVoxels = voxels;
    if (
      transpose
        .map((lookupIndex, index) => lookupIndex === index)
        .some((match) => !match)
    ) {
      transposeVoxels = transposeVoxels.transpose(...transpose);
    }

    // Iterate through layers in the main dimension.
    for (let layer = 0; layer < size; layer++) {
      // Prepare a map to hold color information for both "sides" of this layer of the main dimension.
      const colorMap1_ = ndarray<Color | null>(new Array(size * size), [
        size,
        size,
      ]);
      const colorMap2_ = ndarray<Color | null>(new Array(size * size), [
        size,
        size,
      ]);
      // Iterate through rows and columns inside the layer.
      for (let row = 0; row < size; row++) {
        for (let column = 0; column < size; column++) {
          let color1: Color | null = null;
          let color2: Color | null = null;
          // Find the colour of the specific voxel.
          const material = getMaterial(transposeVoxels.get(layer, row, column));
          // If it isn't empty space...
          if (material !== Material.AIR) {
            const color = getColor(transposeVoxels.get(layer, row, column));
            // Check if there is a voxel on one side of it.
            if (layer + 1 >= size) {
              color1 = color;
            } else {
              const neighbour1 = getMaterial(
                transposeVoxels.get(layer + 1, row, column)
              );
              if (neighbour1 === Material.AIR) {
                // If there is no voxel on this side of it, then the face will be visible and
                // should be added to the color map for this side of the layer.
                color1 = color;
              }
            }
            // Check if there is a voxel on the other side of it.
            if (layer - 1 < 0) {
              color2 = color;
            } else {
              const neighbour2 = getMaterial(
                transposeVoxels.get(layer - 1, row, column)
              );
              if (neighbour2 === Material.AIR) {
                // If there is no voxel on this side of it, then the face will be visible and
                // should be added to the color map for this side of the layer.
                color2 = color;
              }
            }
          }
          colorMap1_.set(row, column, color1 as any);
          colorMap2_.set(row, column, color2 as any);
        }
      }

      // Greedy meshing (try to create as few polys as possible for each face):

      // Loop through the colour map for this layer of the dimension.
      for (let row = 0; row < size; row++) {
        for (let column = 0; column < size; column++) {
          // For each side, if the current voxel should be rendered, check if we can expand it
          const color1 = colorMap1_.get(row, column);
          if (color1 !== null) {
            // Start with it at height 1, and expand until we run out of voxels of the same color.
            let height = 1;
            let canExpandHeight = true;
            while (canExpandHeight) {
              const nextHeight = height + 1;
              const rowToCheck = row + nextHeight - 1;

              // No point proceeding if we'd expand off the colour map.
              if (rowToCheck >= size) {
                canExpandHeight = false;
              } else {
                const nextColor = colorMap1_.get(rowToCheck, column);
                if (nextColor !== null && nextColor === color1) {
                  // Success, expand!
                  height = nextHeight;
                  // Blank that voxel from the color map, we don't need to check it again as it is
                  // part of this mesh.
                  colorMap1_.set(rowToCheck, column, null as any);
                } else {
                  canExpandHeight = false;
                }
              }
            }

            // Now try to perform a similar expansion in the other direction.
            let width = 1;
            let canExpandWidth = true;
            while (canExpandWidth) {
              const nextWidth = width + 1;
              const columnToCheck = column + nextWidth - 1;

              if (columnToCheck >= size) {
                canExpandWidth = false;
              } else {
                // We are now trying to expand a face width-ways that may be taller than one voxel.
                // We will need to check the colour of each voxel in the potential column.
                let nextColumnMatches = true;
                for (let i = 0; i < height; i++) {
                  const nextColor = colorMap1_.get(row + i, columnToCheck);
                  if (nextColor === null || nextColor !== color1) {
                    nextColumnMatches = false;
                  }
                }

                if (nextColumnMatches) {
                  width = nextWidth;
                  for (let i = 0; i < height; i++) {
                    colorMap1_.set(row + i, columnToCheck, null as any);
                  }
                } else {
                  canExpandWidth = false;
                }
              }
            }

            addFaceToMesh(
              transpose,
              layer,
              row,
              column,
              width,
              height,
              true,
              color1
            );
          }

          // Repeat the above for the other color map
          const color2 = colorMap2_.get(row, column);
          if (color2 !== null) {
            let height = 1;
            let canExpandHeight = true;
            while (canExpandHeight) {
              const nextHeight = height + 1;
              const rowToCheck = row + nextHeight - 1;

              if (rowToCheck >= size) {
                canExpandHeight = false;
              } else {
                const nextColor = colorMap2_.get(rowToCheck, column);
                if (nextColor !== null && nextColor === color2) {
                  height = nextHeight;
                  colorMap2_.set(rowToCheck, column, null as any);
                } else {
                  canExpandHeight = false;
                }
              }
            }

            let width = 1;
            let canExpandWidth = true;
            while (canExpandWidth) {
              const nextWidth = width + 1;
              const columnToCheck = column + nextWidth - 1;

              if (columnToCheck >= size) {
                canExpandWidth = false;
              } else {
                let nextColumnMatches = true;
                for (let i = 0; i < height; i++) {
                  const nextColor = colorMap2_.get(row + i, columnToCheck);
                  if (nextColor === null || nextColor !== color2) {
                    nextColumnMatches = false;
                  }
                }

                if (nextColumnMatches) {
                  width = nextWidth;
                  for (let i = 0; i < height; i++) {
                    colorMap2_.set(row + i, columnToCheck, null as any);
                  }
                } else {
                  canExpandWidth = false;
                }
              }
            }

            addFaceToMesh(
              transpose,
              layer,
              row,
              column,
              width,
              height,
              false,
              color2
            );
          }
        }
      }
    }
  }

  function addFaceToMesh(
    transpose: [number, number, number],
    layer: number,
    row: number,
    column: number,
    width: number,
    height: number,
    front: boolean,
    color: Color
  ) {
    const prevIndex = result.position.length / 3;

    const layerLow = layer;
    const layerHigh = layerLow + 1;
    const layerActual = front ? layerHigh : layerLow;

    const rowLow = row;
    const rowHigh = rowLow + height;
    const columnLow = column;
    const columnHigh = columnLow + width;

    const transposeIndex0 = transpose.indexOf(0);
    const transposeIndex1 = transpose.indexOf(1);
    const transposeIndex2 = transpose.indexOf(2);

    const vertex0 = [layerActual, rowLow, columnLow];
    const vertex1 = [layerActual, rowHigh, columnLow];
    const vertex2 = [layerActual, rowHigh, columnHigh];
    const vertex3 = [layerActual, rowLow, columnHigh];
    result.position.push(
      vertex0[transposeIndex0],
      vertex0[transposeIndex1],
      vertex0[transposeIndex2],
      vertex1[transposeIndex0],
      vertex1[transposeIndex1],
      vertex1[transposeIndex2],
      vertex2[transposeIndex0],
      vertex2[transposeIndex1],
      vertex2[transposeIndex2],
      vertex3[transposeIndex0],
      vertex3[transposeIndex1],
      vertex3[transposeIndex2]
    );

    const normal = [front ? 1 : -1, 0, 0];
    result.normal.push(
      normal[transposeIndex0],
      normal[transposeIndex1],
      normal[transposeIndex2],
      normal[transposeIndex0],
      normal[transposeIndex1],
      normal[transposeIndex2],
      normal[transposeIndex0],
      normal[transposeIndex1],
      normal[transposeIndex2],
      normal[transposeIndex0],
      normal[transposeIndex1],
      normal[transposeIndex2]
    );

    const rgba = getRgba(color);
    result.color.push(
      rgba[0],
      rgba[1],
      rgba[2],
      rgba[3],
      rgba[0],
      rgba[1],
      rgba[2],
      rgba[3],
      rgba[0],
      rgba[1],
      rgba[2],
      rgba[3],
      rgba[0],
      rgba[1],
      rgba[2],
      rgba[3]
    );

    if (front) {
      result.index.push(
        prevIndex,
        prevIndex + 1,
        prevIndex + 2,
        prevIndex,
        prevIndex + 2,
        prevIndex + 3
      );
    } else {
      result.index.push(
        prevIndex,
        prevIndex + 2,
        prevIndex + 1,
        prevIndex,
        prevIndex + 3,
        prevIndex + 2
      );
    }
  }

  runDimension([0, 1, 2]);
  runDimension([1, 2, 0]);
  runDimension([2, 0, 1]);

  return {
    position: Float32Array.from(result.position),
    color: Float32Array.from(result.color),
    index: Uint16Array.from(result.index),
    normal: Float32Array.from(result.normal),
  };
}
