import type {
  Detection,
  DetectionSource,
  DetectOptions,
  ObjectDetector,
} from '@/utils/detection-types';

type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; requestId: number; detections: Detection[] }
  | { type: 'error'; requestId?: number; message: string };

type PendingRequest = {
  resolve: (detections: Detection[]) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

let detectorPromise: Promise<ObjectDetector> | null = null;
const INITIALIZATION_TIMEOUT_MS = 60_000;
const INFERENCE_TIMEOUT_MS = 20_000;

class Yolo26Client implements ObjectDetector {
  readonly id = 'yolo26s' as const;
  readonly name = 'YOLO26s';
  private readonly pending = new Map<number, PendingRequest>();
  private nextRequestId = 1;
  private queue: Promise<void> = Promise.resolve();
  private failed = false;

  constructor(private readonly worker: Worker) {
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.type === 'result') {
        const request = this.pending.get(response.requestId);
        if (!request) return;
        clearTimeout(request.timeout);
        request.resolve(response.detections);
        this.pending.delete(response.requestId);
      } else if (response.type === 'error' && response.requestId !== undefined) {
        const request = this.pending.get(response.requestId);
        if (!request) return;
        clearTimeout(request.timeout);
        request.reject(new Error(response.message));
        this.pending.delete(response.requestId);
      }
    });
    worker.addEventListener('error', () => {
      this.fail(new Error('The YOLO26s inference worker stopped unexpectedly.'));
    });
  }

  private fail(error: Error) {
    if (this.failed) return;
    this.failed = true;
    this.worker.terminate();
    this.pending.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(error);
    });
    this.pending.clear();
  }

  detect(source: DetectionSource, options: DetectOptions = {}) {
    const task = this.queue.then(async () => {
      if (this.failed) throw new Error('YOLO26s is no longer available.');
      const image = await createImageBitmap(source);
      const requestId = this.nextRequestId;
      this.nextRequestId += 1;
      const result = new Promise<Detection[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.fail(new Error('YOLO26s inference exceeded the device time limit.'));
        }, INFERENCE_TIMEOUT_MS);
        this.pending.set(requestId, { resolve, reject, timeout });
      });
      try {
        this.worker.postMessage({ type: 'detect', requestId, image, options }, [image]);
      } catch (error) {
        image.close();
        this.fail(error instanceof Error ? error : new Error('Could not send an image to YOLO26s.'));
      }
      return result;
    });
    this.queue = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }
}

export function getYolo26Detector(): Promise<ObjectDetector> {
  if (!detectorPromise) {
    detectorPromise = new Promise<ObjectDetector>((resolve, reject) => {
      if (!('Worker' in window) || !('OffscreenCanvas' in window) || !('createImageBitmap' in window)) {
        reject(new Error('This browser does not support worker-based image inference.'));
        return;
      }

      const worker = new Worker(new URL('./yolo26-detector.ts', import.meta.url));
      const initializationTimeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('YOLO26s initialization exceeded the device time limit.'));
      }, INITIALIZATION_TIMEOUT_MS);
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'ready') {
          clearTimeout(initializationTimeout);
          worker.removeEventListener('message', handleMessage);
          resolve(new Yolo26Client(worker));
        } else if (event.data.type === 'error' && event.data.requestId === undefined) {
          clearTimeout(initializationTimeout);
          worker.removeEventListener('message', handleMessage);
          worker.terminate();
          reject(new Error(event.data.message));
        }
      };
      worker.addEventListener('message', handleMessage);
      worker.addEventListener(
        'error',
        () => {
          clearTimeout(initializationTimeout);
          worker.terminate();
          reject(new Error('The YOLO26s inference worker could not start.'));
        },
        { once: true },
      );
      worker.postMessage({ type: 'initialize' });
    }).catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
}
