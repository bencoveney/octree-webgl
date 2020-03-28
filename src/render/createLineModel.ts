import { ModelData } from "./model";
import { LineModelData } from "./lineModel";

export function createLineModel({
  position,
  color,
  index
}: ModelData): LineModelData {
  const newIndex = [];
  for (let triplet = 0; triplet < index.length; triplet += 3) {
    newIndex.push(
      index[triplet],
      index[triplet + 1],
      index[triplet + 1],
      index[triplet + 2],
      index[triplet + 2],
      index[triplet]
    );
  }
  return {
    position,
    color,
    index: newIndex,
    count: newIndex.length
  };
}
