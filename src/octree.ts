import { vec3 } from "gl-matrix";

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
        vec3.fromValues(
          center[0] - nextHalfSize,
          center[1] - nextHalfSize,
          center[2] - nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] + nextHalfSize,
          center[1] - nextHalfSize,
          center[2] - nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] - nextHalfSize,
          center[1] + nextHalfSize,
          center[2] - nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] + nextHalfSize,
          center[1] + nextHalfSize,
          center[2] - nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] - nextHalfSize,
          center[1] - nextHalfSize,
          center[2] + nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] + nextHalfSize,
          center[1] - nextHalfSize,
          center[2] + nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] - nextHalfSize,
          center[1] + nextHalfSize,
          center[2] + nextHalfSize
        ),
        nextHalfSize
      ),
      createNode(
        innerNode,
        nextDepth,
        vec3.fromValues(
          center[0] + nextHalfSize,
          center[1] + nextHalfSize,
          center[2] + nextHalfSize
        ),
        nextHalfSize
      )
    );

    return innerNode;
  }

  const firstHalfSize = firstSize / 2;
  const firstCenter = vec3.fromValues(0, 0, 0);

  return createNode(null, depth, firstCenter, firstHalfSize);
}

export function flatten<T>(octree: Node<T>): LeafNode<T>[] {
  if (octree.isLeaf) {
    return [octree];
  } else {
    return (octree as InnerNode<T>).children.map(flatten).flat();
  }
}
