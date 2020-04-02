export function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function logNTimes(nMin: number, nMax: number): typeof console.log {
  let count = 0;
  return function() {
    if (count <= nMax && count >= nMin) {
      console.log.apply(console, arguments as any);
    }
    count++;
  };
}
