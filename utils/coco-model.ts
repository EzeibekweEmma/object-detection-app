import { load, type ObjectDetection } from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

let modelPromise: Promise<ObjectDetection> | null = null;

/**
 * Load one model for the lifetime of the page. Both camera and image detection
 * use this promise, which avoids downloading and warming up the model twice.
 */
export function getCocoModel(): Promise<ObjectDetection> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.setBackend('webgl');
      } catch {
        await tf.setBackend('cpu');
      }

      await tf.ready();
      return load({ base: 'lite_mobilenet_v2' });
    })().catch((error) => {
      // Allow a later retry when an initial download or backend setup fails.
      modelPromise = null;
      throw error;
    });
  }

  return modelPromise;
}
