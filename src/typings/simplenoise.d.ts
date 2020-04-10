declare module "simplenoise" {
  declare function simplex2(x: number, y: number): number;
  declare function simplex3(x: number, y: number, z: number): number;
  declare function perlin2(x: number, y: number): number;
  declare function perlin3(x: number, y: number, z: number): number;
  declare function seed(val: number): number;
}
