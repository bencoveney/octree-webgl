import ndarray from "ndarray";

export function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function forEach3d<T>(
  array3d: ndarray<T>,
  callback: (t: T, x: number, y: number, z: number) => void
): void {
  for (let x = 0; x < array3d.shape[0]; x++) {
    for (let y = 0; y < array3d.shape[1]; y++) {
      for (let z = 0; z < array3d.shape[2]; z++) {
        callback(array3d.get(x, y, z), x, y, z);
      }
    }
  }
}
