import { getCocoModel } from '@/utils/coco-model';
import type {
  DetectionSource,
  DetectOptions,
  ObjectDetector,
} from '@/utils/detection-types';
import { getYolo26Detector } from '@/utils/yolo26-client';

let preferredDetectorPromise: Promise<ObjectDetector> | null = null;
let cocoDetectorPromise: Promise<ObjectDetector> | null = null;

function createCocoFallback(): Promise<ObjectDetector> {
  if (!cocoDetectorPromise) {
    cocoDetectorPromise = getCocoModel()
      .then((model) => ({
        id: 'coco-ssd' as const,
        name: 'COCO-SSD fallback',
        detect(source: DetectionSource, options: DetectOptions = {}) {
          return model.detect(
            source,
            options.maxDetections ?? 20,
            options.scoreThreshold ?? 0.5,
          );
        },
      }))
      .catch((error) => {
        cocoDetectorPromise = null;
        throw error;
      });
  }

  return cocoDetectorPromise;
}

async function createResilientDetector(): Promise<ObjectDetector> {
  let activeDetector: ObjectDetector;

  try {
    activeDetector = await getYolo26Detector();
  } catch (error) {
    console.warn('YOLO26s could not start; using COCO-SSD.', error);
    activeDetector = await createCocoFallback();
  }

  return {
    get id() {
      return activeDetector.id;
    },
    get name() {
      return activeDetector.name;
    },
    async detect(source: DetectionSource, options: DetectOptions = {}) {
      try {
        return await activeDetector.detect(source, options);
      } catch (error) {
        if (activeDetector.id !== 'yolo26s') throw error;
        console.warn('YOLO26s inference failed; switching to COCO-SSD.', error);
        activeDetector = await createCocoFallback();
        return activeDetector.detect(source, options);
      }
    },
  };
}

/**
 * Prefer the more accurate YOLO26s detector. COCO-SSD remains a graceful
 * fallback for browsers that cannot initialize the current LiteRT runtime.
 */
export function getObjectDetector(): Promise<ObjectDetector> {
  if (!preferredDetectorPromise) {
    preferredDetectorPromise = createResilientDetector().catch((error) => {
      preferredDetectorPromise = null;
      throw error;
    });
  }

  return preferredDetectorPromise;
}
