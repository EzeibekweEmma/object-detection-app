export type BoundingBox = [x: number, y: number, width: number, height: number];

export type Detection = {
  bbox: BoundingBox;
  class: string;
  score: number;
};

export type DetectionSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export type DetectOptions = {
  maxDetections?: number;
  scoreThreshold?: number;
};

export interface ObjectDetector {
  readonly id: 'yolo26s' | 'coco-ssd';
  readonly name: string;
  detect(source: DetectionSource, options?: DetectOptions): Promise<Detection[]>;
}
