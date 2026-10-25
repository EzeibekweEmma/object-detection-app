export type BoundingBox = [x: number, y: number, width: number, height: number];

export type Detection = {
  bbox: BoundingBox;
  class: string;
  score: number;
};
