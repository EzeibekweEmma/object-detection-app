/// <reference lib="webworker" />

import type {
  BoundingBox,
  Detection,
  DetectOptions,
} from '@/utils/detection-types';
import {
  getWebGpuDevice,
  loadAndCompile,
  loadLiteRt,
  Tensor,
  type CompiledModel,
} from '@litertjs/core';

const MODEL_URL = '/models/yolo26s_w8a32.tflite';
const WASM_URL = '/litert/';
const DEFAULT_SCORE_THRESHOLD = 0.45;
const DEFAULT_MAX_DETECTIONS = 20;
const NMS_IOU_THRESHOLD = 0.5;
const RGB_CHANNELS = 3;

// COCO's class order is part of the model contract. Do not alphabetize it.
const COCO_CLASSES = [
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'airplane',
  'bus',
  'train',
  'truck',
  'boat',
  'traffic light',
  'fire hydrant',
  'stop sign',
  'parking meter',
  'bench',
  'bird',
  'cat',
  'dog',
  'horse',
  'sheep',
  'cow',
  'elephant',
  'bear',
  'zebra',
  'giraffe',
  'backpack',
  'umbrella',
  'handbag',
  'tie',
  'suitcase',
  'frisbee',
  'skis',
  'snowboard',
  'sports ball',
  'kite',
  'baseball bat',
  'baseball glove',
  'skateboard',
  'surfboard',
  'tennis racket',
  'bottle',
  'wine glass',
  'cup',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'sandwich',
  'orange',
  'broccoli',
  'carrot',
  'hot dog',
  'pizza',
  'donut',
  'cake',
  'chair',
  'couch',
  'potted plant',
  'bed',
  'dining table',
  'toilet',
  'tv',
  'laptop',
  'mouse',
  'remote',
  'keyboard',
  'cell phone',
  'microwave',
  'oven',
  'toaster',
  'sink',
  'refrigerator',
  'book',
  'clock',
  'vase',
  'scissors',
  'teddy bear',
  'hair drier',
  'toothbrush',
] as const;

type LetterboxTransform = {
  scale: number;
  padX: number;
  padY: number;
  sourceWidth: number;
  sourceHeight: number;
  inputWidth: number;
  inputHeight: number;
};

type Candidate = Detection & { classId: number };

type WorkerRequest =
  | { type: 'initialize' }
  | { type: 'detect'; requestId: number; image: ImageBitmap; options: DetectOptions };

type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; requestId: number; detections: Detection[] }
  | { type: 'error'; requestId?: number; message: string };

let detectorPromise: Promise<Yolo26Detector> | null = null;

function intersectionOverUnion(a: BoundingBox, b: BoundingBox) {
  const left = Math.max(a[0], b[0]);
  const top = Math.max(a[1], b[1]);
  const right = Math.min(a[0] + a[2], b[0] + b[2]);
  const bottom = Math.min(a[1] + a[3], b[1] + b[3]);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a[2] * a[3] + b[2] * b[3] - intersection;
  return union > 0 ? intersection / union : 0;
}

function nonMaxSuppression(candidates: Candidate[], limit: number) {
  const selected: Candidate[] = [];

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const overlapsSelected = selected.some(
      (current) =>
        current.classId === candidate.classId &&
        intersectionOverUnion(current.bbox, candidate.bbox) > NMS_IOU_THRESHOLD,
    );

    if (!overlapsSelected) selected.push(candidate);
    if (selected.length === limit) break;
  }

  return selected;
}

function restoreBox(
  box: [number, number, number, number],
  transform: LetterboxTransform,
  normalized: boolean,
): BoundingBox | null {
  let [centerX, centerY, width, height] = box;

  if (normalized) {
    centerX *= transform.inputWidth;
    centerY *= transform.inputHeight;
    width *= transform.inputWidth;
    height *= transform.inputHeight;
  }

  const left = Math.max(0, (centerX - width / 2 - transform.padX) / transform.scale);
  const top = Math.max(0, (centerY - height / 2 - transform.padY) / transform.scale);
  const right = Math.min(
    transform.sourceWidth,
    (centerX + width / 2 - transform.padX) / transform.scale,
  );
  const bottom = Math.min(
    transform.sourceHeight,
    (centerY + height / 2 - transform.padY) / transform.scale,
  );

  if (right <= left || bottom <= top) return null;
  return [left, top, right - left, bottom - top];
}

function restoreEndToEndBox(
  box: [number, number, number, number],
  transform: LetterboxTransform,
  normalized: boolean,
): BoundingBox | null {
  let [left, top, right, bottom] = box;

  if (normalized) {
    left *= transform.inputWidth;
    right *= transform.inputWidth;
    top *= transform.inputHeight;
    bottom *= transform.inputHeight;
  }

  left = Math.max(0, (left - transform.padX) / transform.scale);
  top = Math.max(0, (top - transform.padY) / transform.scale);
  right = Math.min(transform.sourceWidth, (right - transform.padX) / transform.scale);
  bottom = Math.min(transform.sourceHeight, (bottom - transform.padY) / transform.scale);

  if (right <= left || bottom <= top) return null;
  return [left, top, right - left, bottom - top];
}

function parseRawOutput(
  data: Float32Array,
  shape: readonly number[],
  transform: LetterboxTransform,
  scoreThreshold: number,
  maxDetections: number,
) {
  const channelFirst = shape[1] === COCO_CLASSES.length + 4;
  const channelCount = channelFirst ? shape[1] : shape[2];
  const candidateCount = channelFirst ? shape[2] : shape[1];

  if (channelCount !== COCO_CLASSES.length + 4) {
    throw new Error(`Unsupported YOLO output shape: ${shape.join('x')}`);
  }

  const valueAt = (candidateIndex: number, channelIndex: number) =>
    channelFirst
      ? data[channelIndex * candidateCount + candidateIndex]
      : data[candidateIndex * channelCount + channelIndex];
  const candidates: Candidate[] = [];

  for (let candidateIndex = 0; candidateIndex < candidateCount; candidateIndex += 1) {
    let classId = 0;
    let score = valueAt(candidateIndex, 4);

    for (let index = 1; index < COCO_CLASSES.length; index += 1) {
      const classScore = valueAt(candidateIndex, index + 4);
      if (classScore > score) {
        score = classScore;
        classId = index;
      }
    }

    if (!Number.isFinite(score) || score < scoreThreshold) continue;

    const rawBox: [number, number, number, number] = [
      valueAt(candidateIndex, 0),
      valueAt(candidateIndex, 1),
      valueAt(candidateIndex, 2),
      valueAt(candidateIndex, 3),
    ];
    const normalized = rawBox.every((value) => Math.abs(value) <= 2);
    const bbox = restoreBox(rawBox, transform, normalized);

    if (bbox) {
      candidates.push({ bbox, class: COCO_CLASSES[classId], score, classId });
    }
  }

  return nonMaxSuppression(candidates, maxDetections);
}

function parseEndToEndOutput(
  data: Float32Array,
  shape: readonly number[],
  transform: LetterboxTransform,
  scoreThreshold: number,
  maxDetections: number,
) {
  const rowFirst = shape[2] === 6;
  const detectionCount = rowFirst ? shape[1] : shape[2];
  const valueAt = (detectionIndex: number, valueIndex: number) =>
    rowFirst ? data[detectionIndex * 6 + valueIndex] : data[valueIndex * detectionCount + detectionIndex];
  const detections: Detection[] = [];

  for (let index = 0; index < detectionCount; index += 1) {
    const score = valueAt(index, 4);
    const classId = Math.round(valueAt(index, 5));
    if (score < scoreThreshold || !COCO_CLASSES[classId]) continue;

    const rawBox: [number, number, number, number] = [
      valueAt(index, 0),
      valueAt(index, 1),
      valueAt(index, 2),
      valueAt(index, 3),
    ];
    const normalized = rawBox.every((value) => Math.abs(value) <= 2);
    const bbox = restoreEndToEndBox(rawBox, transform, normalized);
    if (bbox) detections.push({ bbox, class: COCO_CLASSES[classId], score });
    if (detections.length === maxDetections) break;
  }

  return detections;
}

class Yolo26Detector {
  private readonly canvas = new OffscreenCanvas(1, 1);
  private readonly context: OffscreenCanvasRenderingContext2D;

  constructor(
    private readonly model: CompiledModel,
    private readonly inputShape: number[],
  ) {
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Offscreen canvas 2D is unavailable.');
    this.context = context;
  }

  async detect(source: ImageBitmap, options: DetectOptions = {}) {
    const sourceWidth = source.width;
    const sourceHeight = source.height;
    if (sourceWidth <= 0 || sourceHeight <= 0) return [];

    const channelFirst = this.inputShape[1] === RGB_CHANNELS;
    const inputHeight = channelFirst ? this.inputShape[2] : this.inputShape[1];
    const inputWidth = channelFirst ? this.inputShape[3] : this.inputShape[2];
    if (!inputWidth || !inputHeight) {
      throw new Error(`Unsupported YOLO input shape: ${this.inputShape.join('x')}`);
    }

    const scale = Math.min(inputWidth / sourceWidth, inputHeight / sourceHeight);
    const renderedWidth = Math.round(sourceWidth * scale);
    const renderedHeight = Math.round(sourceHeight * scale);
    const padX = Math.floor((inputWidth - renderedWidth) / 2);
    const padY = Math.floor((inputHeight - renderedHeight) / 2);
    const transform: LetterboxTransform = {
      scale,
      padX,
      padY,
      sourceWidth,
      sourceHeight,
      inputWidth,
      inputHeight,
    };

    this.canvas.width = inputWidth;
    this.canvas.height = inputHeight;
    this.context.fillStyle = 'rgb(114 114 114)';
    this.context.fillRect(0, 0, inputWidth, inputHeight);
    this.context.drawImage(source, padX, padY, renderedWidth, renderedHeight);

    const pixels = this.context.getImageData(0, 0, inputWidth, inputHeight).data;
    const inputData = new Float32Array(inputWidth * inputHeight * RGB_CHANNELS);
    const pixelCount = inputWidth * inputHeight;

    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
      const rgbaIndex = pixelIndex * 4;
      if (channelFirst) {
        inputData[pixelIndex] = pixels[rgbaIndex] / 255;
        inputData[pixelCount + pixelIndex] = pixels[rgbaIndex + 1] / 255;
        inputData[pixelCount * 2 + pixelIndex] = pixels[rgbaIndex + 2] / 255;
      } else {
        const rgbIndex = pixelIndex * RGB_CHANNELS;
        inputData[rgbIndex] = pixels[rgbaIndex] / 255;
        inputData[rgbIndex + 1] = pixels[rgbaIndex + 1] / 255;
        inputData[rgbIndex + 2] = pixels[rgbaIndex + 2] / 255;
      }
    }

    const inputTensor = new Tensor(inputData, this.inputShape);
    let outputTensors: Tensor[] = [];

    try {
      outputTensors = await this.model.run(inputTensor);
      const outputTensor = outputTensors[0];
      if (!outputTensor) throw new Error('YOLO26s returned no output tensor.');
      const outputData = await outputTensor.data();
      if (!(outputData instanceof Float32Array)) {
        throw new Error(`Unsupported YOLO output type: ${outputTensor.dtype}`);
      }

      const outputShape = Array.from(outputTensor.shape);
      const scoreThreshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD;
      const maxDetections = options.maxDetections ?? DEFAULT_MAX_DETECTIONS;

      if (outputShape.includes(6)) {
        return parseEndToEndOutput(
          outputData,
          outputShape,
          transform,
          scoreThreshold,
          maxDetections,
        );
      }

      return parseRawOutput(outputData, outputShape, transform, scoreThreshold, maxDetections);
    } finally {
      inputTensor.delete();
      outputTensors.forEach((tensor) => tensor.delete());
    }
  }
}

function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      // Emscripten otherwise resolves the Wasm binary relative to the bundled
      // worker chunk instead of the public LiteRT asset directory.
      const workerGlobal = self as typeof self & {
        Module?: { locateFile: (path: string) => string };
      };
      workerGlobal.Module = {
        locateFile: (path) => new URL(path, `${self.location.origin}${WASM_URL}`).href,
      };
      await loadLiteRt(WASM_URL);
      let model: CompiledModel;

      if (getWebGpuDevice()) {
        try {
          model = await loadAndCompile(MODEL_URL, { accelerator: 'webgpu' });
        } catch {
          model = await loadAndCompile(MODEL_URL, {
            accelerator: 'wasm',
            cpuOptions: { numThreads: Math.min(navigator.hardwareConcurrency || 2, 4) },
          });
        }
      } else {
        model = await loadAndCompile(MODEL_URL, {
          accelerator: 'wasm',
          cpuOptions: { numThreads: Math.min(navigator.hardwareConcurrency || 2, 4) },
        });
      }

      const input = model.getInputDetails()[0];
      if (!input || input.dtype !== 'float32') {
        model.delete();
        throw new Error('The YOLO26s model does not expose the expected FP32 input.');
      }

      return new Yolo26Detector(model, Array.from(input.shape));
    })().catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
}

function post(response: WorkerResponse) {
  self.postMessage(response);
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown YOLO26s worker error.';
}

let inferenceQueue: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'initialize') {
    void getDetector().then(
      () => post({ type: 'ready' }),
      (error) => post({ type: 'error', message: messageFrom(error) }),
    );
    return;
  }

  const { image, options, requestId } = event.data;
  inferenceQueue = inferenceQueue
    .then(async () => {
      try {
        const detector = await getDetector();
        const detections = await detector.detect(image, options);
        post({ type: 'result', requestId, detections });
      } catch (error) {
        post({ type: 'error', requestId, message: messageFrom(error) });
      } finally {
        image.close();
      }
    })
    .catch(() => undefined);
};
