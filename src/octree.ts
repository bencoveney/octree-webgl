import { vec3, vec4 } from "gl-matrix";
import { ModelData } from "./render/modelStore";
import ndarray from "ndarray";

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
  callback: (center: vec3) => T
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
        value: callback(center)
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
  const firstCenter: vec3 = [firstHalfSize, firstHalfSize, firstHalfSize];

  return createNode(null, depth, firstCenter, firstHalfSize);
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

export function createLookup<T>(
  octree: Node<T>,
  size: number
): ndarray<LeafNode<T>> {
  const result = ndarray<LeafNode<T>>(
    new Array<LeafNode<T>>(size * size * size),
    [size, size, size]
  );
  forEachLeaf(octree, leaf =>
    result.set(
      leaf.center[0] - leaf.halfSize,
      leaf.center[1] - leaf.halfSize,
      leaf.center[2] - leaf.halfSize,
      leaf as any
    )
  );
  return result;
}

type Color = vec4 | null;

export function lookupToMesh<T>(
  lookup: ndarray<LeafNode<T>>,
  getleafColor: (leaf: LeafNode<T>) => Color
): ModelData {
  const result: ModelData = {
    position: [],
    color: [],
    index: [],
    normal: []
  };
  const size = lookup.shape[0];
  const halfSize = size / 2;

  function runDimension(
    transposeLookup: ndarray<LeafNode<T>>,
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
    for (let layer = 0; layer < size; layer++) {
      // Prepare a map to hold color information for both "sides" of this layer of the main dimension.
      const colorMap1: Color[][] = [];
      const colorMap2: Color[][] = [];
      // Iterate through rows and columns inside the layer.
      for (let row = 0; row < size; row++) {
        const mapRow1: Color[] = [];
        colorMap1.push(mapRow1);
        const mapRow2: Color[] = [];
        colorMap2.push(mapRow2);
        for (let column = 0; column < size; column++) {
          let color1: Color = null;
          let color2: Color = null;
          // Find the colour of the specific voxel.
          const leaf = transposeLookup.get(layer, row, column);
          const color = getleafColor(leaf);
          // If it isn't empty space...
          if (color) {
            // Check if there is a voxel on one side of it.
            if (layer + 1 >= size) {
              color1 = color;
            } else {
              const neighbour1 = transposeLookup.get(layer + 1, row, column);
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
            }
            // Check if there is a voxel on the other side of it.
            if (layer - 1 < 0) {
              color2 = color;
            } else {
              const neighbour2 = transposeLookup.get(layer - 1, row, column);
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
          }
          mapRow1.push(color1);
          mapRow2.push(color2);
        }
      }

      // Greedy meshing (try to create as few polys as possible for each face):

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

            addFace(layer, row, column, width, height, true, color1);
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

            addFace(layer, row, column, width, height, false, color2);
          }
        }
      }
    }
  }

  // X faces. X = layer, Y = row, Z = column
  runDimension(lookup, (layer, row, column, width, height, front, color) => {
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
  });

  const transposeLookup = lookup.transpose(1, 0, 2);

  // Y faces. Y = layer, X = row, Z = column
  runDimension(
    transposeLookup,
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

  const transposeLookup2 = lookup.transpose(2, 0, 1);

  // Z faces. Z = layer, X = row, Y = column
  runDimension(
    transposeLookup2,
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
