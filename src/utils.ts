import ndarray from "ndarray";

export const SKYBLUE = [135, 206, 235, 255];

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

export function forEach2d<T>(
  array2d: ndarray<T>,
  callback: (t: T, x: number, y: number) => void
): void {
  for (let x = 0; x < array2d.shape[0]; x++) {
    for (let y = 0; y < array2d.shape[1]; y++) {
      callback(array2d.get(x, y), x, y);
    }
  }
}
