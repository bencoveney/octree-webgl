import { vec3, vec4 } from "gl-matrix";
import { ModelData } from "./render/modelStore";

type Children<T> = [
  Node<T>,
  Node<T>,
  Node<T>,
  Node<T>,
  Node<T>,
  Node<T>,
  Node<T>,
  Node<T>
];

export interface InnerNode<T> {
  children: Children<T>;
  parent: Node<T> | null;
  center: vec3;
  halfSize: number;
  isLeaf: false;
}

export interface LeafNode<T> {
  parent: Node<T> | null;
  center: vec3;
  halfSize: number;
  isLeaf: true;
  value: T;
}

type Node<T> = InnerNode<T> | LeafNode<T>;

export function create<T>(
  depth: number,
  callback: (center: vec3, size: number) => T
): Node<T> {
  const firstSize = Math.pow(2, depth);

  function createNode(
    parent: Node<T> | null,
    currentDepth: number,
    center: vec3,
    halfSize: number
  ): Node<T> {
    if (currentDepth === 0) {
      const leaf: LeafNode<T> = {
        parent,
        center,
        halfSize,
        isLeaf: true,
        value: callback(center, firstSize)
      };
      return leaf;
    }

    const innerNode: InnerNode<T> = {
      children: ([] as Node<T>[]) as Children<T>,
      parent,
      center,
      halfSize,
      isLeaf: false
    };

    const nextDepth = currentDepth - 1;
    const nextHalfSize = halfSize / 2;

    innerNode.children.push(
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] - nextHalfSize,
          center[1] - nextHalfSize,
          center[2] - nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] + nextHalfSize,
          center[1] - nextHalfSize,
          center[2] - nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] - nextHalfSize,
          center[1] + nextHalfSize,
          center[2] - nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] + nextHalfSize,
          center[1] + nextHalfSize,
          center[2] - nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] - nextHalfSize,
          center[1] - nextHalfSize,
          center[2] + nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] + nextHalfSize,
          center[1] - nextHalfSize,
          center[2] + nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] - nextHalfSize,
          center[1] + nextHalfSize,
          center[2] + nextHalfSize
        ],
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        [
          center[0] + nextHalfSize,
          center[1] + nextHalfSize,
          center[2] + nextHalfSize
        ],
        nextHalfSize
      )
    );

    return innerNode;
  }

  const firstHalfSize = firstSize / 2;
  const firstCenter: vec3 = [0, 0, 0];

  return createNode(null, depth, firstCenter, firstHalfSize);
}

export function flatten<T>(octree: Node<T>): LeafNode<T>[] {
  if (octree.isLeaf) {
    return [octree];
  } else {
    return octree.children.map(flatten).flat();
  }
}

export function forEachLeaf<T>(
  octree: Node<T>,
  callback: (leaf: LeafNode<T>) => void
): void {
  if (octree.isLeaf) {
    callback(octree);
  } else {
    octree.children.forEach(child => forEachLeaf(child, callback));
  }
}

type Lookup<T> = {
  [xPosition: number]: {
    [yPosition: number]: {
      [zPosition: number]: T;
    };
  };
};
export function createLookup<T>(octree: Node<T>): Lookup<LeafNode<T>> {
  const result: Lookup<LeafNode<T>> = {};
  forEachLeaf(octree, leaf => {
    const x = leaf.center[0];
    if (!result[x]) {
      result[x] = {};
    }
    const xLayer = result[x];

    const y = leaf.center[1];
    if (!xLayer[y]) {
      xLayer[y] = {};
    }
    const yLayer = xLayer[y];

    const z = leaf.center[2];
    yLayer[z] = leaf;
  });
  return result;
}

type Color = vec4 | null;
type ColorMap = Color[][];

export function lookupToMesh<T>(
  lookup: Lookup<LeafNode<T>>,
  getleafColor: (leaf: LeafNode<T>) => Color
): ModelData {
  const result: ModelData = {
    position: [],
    color: [],
    index: [],
    normal: []
  };

  // Assumptions: Keys are uniform, numeric and the same in all dimensions.
  const cleanKeys = Object.keys(lookup)
    .map(key => parseFloat(key))
    .sort((a, b) => a - b);

  // Grab the halfSize from the first leaf voxel we can find, they should all be the same.
  const halfSize = lookup[cleanKeys[0]][cleanKeys[0]][cleanKeys[0]].halfSize;

  function runDimension(
    lookupLeaf: (
      layer: number,
      row: number,
      column: number
    ) => LeafNode<T> | null,
    addFace: (
      layer: number,
      row: number,
      column: number,
      width: number,
      height: number,
      front: boolean,
      color: vec4
    ) => void
  ) {
    // Iterate through layers in the main dimension.
    for (const layer of cleanKeys) {
      // Prepare a map to hold color information for both "sides" of this layer of the main dimension.
      const colorMap1: Color[][] = [];
      const colorMap2: Color[][] = [];
      // Iterate through rows and columns inside the layer.
      for (const row of cleanKeys) {
        const mapRow1: Color[] = [];
        colorMap1.push(mapRow1);
        const mapRow2: Color[] = [];
        colorMap2.push(mapRow2);
        for (const column of cleanKeys) {
          let color1: Color = null;
          let color2: Color = null;
          // Find the colour of the specific voxel.
          const leaf = lookupLeaf(layer, row, column) as LeafNode<T>;
          const color = getleafColor(leaf);
          // If it isn't empty space...
          if (color) {
            // Check if there is a voxel on one side of it.
            const neighbour1 = lookupLeaf(layer + 1, row, column);
            if (neighbour1) {
              const neighbour1Color = getleafColor(neighbour1);
              if (neighbour1Color === null) {
                // If there is no voxel on this side of it, then the face will be visible and
                // should be added to the color map for this side of the layer.
                color1 = color;
              }
            } else {
              color1 = color;
            }
            // Check if there is a voxel on the other side of it.
            const neighbour2 = lookupLeaf(layer - 1, row, column);
            if (neighbour2) {
              const neighbour2Color = getleafColor(neighbour2);
              if (neighbour2Color === null) {
                // If there is no voxel on this side of it, then the face will be visible and
                // should be added to the color map for this side of the layer.
                color2 = color;
              }
            } else {
              color2 = color;
            }
          }
          mapRow1.push(color1);
          mapRow2.push(color2);
        }
      }

      // Greedy meshing (try to create as few polys as possible for each face):

      // Assume both sides of the map are the same length
      const size = colorMap1.length;

      // Loop through the colour map for this layer of the dimension.
      for (let row = 0; row < size; row++) {
        for (let column = 0; column < size; column++) {
          // For each side, if the current voxel should be rendered, check if we can expand it
          const color1 = colorMap1[row][column];
          if (color1) {
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
                const nextColor = colorMap1[rowToCheck][column];
                if (nextColor && vec4.equals(nextColor, color1)) {
                  // Success, expand!
                  height = nextHeight;
                  // Blank that voxel from the color map, we don't need to check it again as it is
                  // part of this mesh.
                  colorMap1[rowToCheck][column] = null;
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
                  const nextColor = colorMap1[row + i][columnToCheck];
                  if (!nextColor || !vec4.equals(nextColor, color1)) {
                    nextColumnMatches = false;
                  }
                }

                if (nextColumnMatches) {
                  width = nextWidth;
                  for (let i = 0; i < height; i++) {
                    colorMap1[row + i][columnToCheck] = null;
                  }
                } else {
                  canExpandWidth = false;
                }
              }
            }

            addFace(
              layer,
              cleanKeys[row],
              cleanKeys[column],
              width,
              height,
              true,
              color1
            );
          }

          // Repeat the above for the other color map
          const color2 = colorMap2[row][column];
          if (color2) {
            let height = 1;
            let canExpandHeight = true;
            while (canExpandHeight) {
              const nextHeight = height + 1;
              const rowToCheck = row + nextHeight - 1;

              if (rowToCheck >= size) {
                canExpandHeight = false;
              } else {
                const nextColor = colorMap2[rowToCheck][column];
                if (nextColor && vec4.equals(nextColor, color2)) {
                  height = nextHeight;
                  colorMap2[rowToCheck][column] = null;
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
                  const nextColor = colorMap2[row + i][columnToCheck];
                  if (!nextColor || !vec4.equals(nextColor, color2)) {
                    nextColumnMatches = false;
                  }
                }

                if (nextColumnMatches) {
                  width = nextWidth;
                  for (let i = 0; i < height; i++) {
                    colorMap2[row + i][columnToCheck] = null;
                  }
                } else {
                  canExpandWidth = false;
                }
              }
            }

            addFace(
              layer,
              cleanKeys[row],
              cleanKeys[column],
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

  // X faces. X = layer, Y = row, Z = column
  runDimension(
    (layer, row, column) => {
      const first = (lookup as any)["" + layer];
      if (!first) {
        return null;
      }
      const second = first["" + row];
      if (!second) {
        return null;
      }
      return second["" + column] || null;
    },
    (layer, row, column, width, height, front, color) => {
      const prevIndex = result.position.length / 3;

      const lowX = layer - halfSize;
      const highX = lowX + 1;
      const x = front ? highX : lowX;

      const lowY = row - halfSize;
      const highY = lowY + height;
      const lowZ = column - halfSize;
      const highZ = lowZ + width;

      result.position.push(
        x,
        lowY,
        lowZ,
        x,
        highY,
        lowZ,
        x,
        highY,
        highZ,
        x,
        lowY,
        highZ
      );

      for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
        result.color.push(color[0], color[1], color[2], color[3]);
      }

      const xNormal = front ? 1 : -1;
      result.normal.push(
        xNormal,
        0,
        0,
        xNormal,
        0,
        0,
        xNormal,
        0,
        0,
        xNormal,
        0,
        0
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
  );

  // Y faces. Y = layer, X = row, Z = column
  runDimension(
    (layer, row, column) => {
      const first = (lookup as any)["" + row];
      if (!first) {
        return null;
      }
      const second = first["" + layer];
      if (!second) {
        return null;
      }
      return second["" + column] || null;
    },
    (layer, row, column, width, height, front, color) => {
      const prevIndex = result.position.length / 3;

      const lowY = layer - halfSize;
      const highY = lowY + 1;
      const y = front ? highY : lowY;

      const lowX = row - halfSize;
      const highX = lowX + height;
      const lowZ = column - halfSize;
      const highZ = lowZ + width;

      result.position.push(
        lowX,
        y,
        lowZ,
        highX,
        y,
        lowZ,
        highX,
        y,
        highZ,
        lowX,
        y,
        highZ
      );

      for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
        result.color.push(color[0], color[1], color[2], color[3]);
      }

      const yNormal = front ? 1 : -1;
      result.normal.push(
        0,
        yNormal,
        0,
        0,
        yNormal,
        0,
        0,
        yNormal,
        0,
        0,
        yNormal,
        0
      );

      if (!front) {
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
  );

  // Z faces. Z = layer, X = row, Y = column
  runDimension(
    (layer, row, column) => {
      const first = (lookup as any)["" + row];
      if (!first) {
        return null;
      }
      const second = first["" + layer];
      if (!second) {
        return null;
      }
      return second["" + column] || null;
    },
    (layer, row, column, width, height, front, color) => {
      const prevIndex = result.position.length / 3;

      const lowZ = layer - halfSize;
      const highZ = lowZ + 1;
      const z = front ? highZ : lowZ;

      const lowX = row - halfSize;
      const highX = lowX + height;
      const lowY = column - halfSize;
      const highY = lowY + width;

      result.position.push(
        lowX,
        lowY,
        z,
        highX,
        lowY,
        z,
        highX,
        highY,
        z,
        lowX,
        highY,
        z
      );

      for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
        result.color.push(color[0], color[1], color[2], color[3]);
      }

      const zNormal = front ? 1 : -1;
      result.normal.push(
        0,
        0,
        zNormal,
        0,
        0,
        zNormal,
        0,
        0,
        zNormal,
        0,
        0,
        zNormal
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
  );

  return result;
}
