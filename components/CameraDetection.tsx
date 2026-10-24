'use client';

import { getCocoModel } from '@/utils/coco-model';
import { renderPredictions } from '@/utils/render-predictions';
import type { ObjectDetection } from '@tensorflow-models/coco-ssd';
import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

function CameraDetection() {
  const [alertToObject, setAlertToObject] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [detectionCount, setDetectionCount] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alertTargetRef = useRef('');
  const cameraFailedRef = useRef(false);

  useEffect(() => {
    alertTargetRef.current = alertToObject;
  }, [alertToObject]);

  useEffect(() => {
    let animationFrame = 0;
    let cancelled = false;
    let model: ObjectDetection | null = null;
    let lastDetectionAt = 0;

    const detectFrame = async (timestamp: number) => {
      if (cancelled) return;

      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      // Limit inference to five frames per second and wait for each inference
      // before scheduling another one so slower devices do not build up work.
      if (
        model &&
        video?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA &&
        canvas &&
        timestamp - lastDetectionAt >= 200
      ) {
        lastDetectionAt = timestamp;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        try {
          const predictions = await model.detect(video, 20, 0.55);
          if (!cancelled) {
            const context = canvas.getContext('2d');
            if (context) {
              renderPredictions(predictions, context, alertTargetRef.current);
              setDetectionCount(predictions.length);
            }
          }
        } catch {
          if (!cancelled) {
            model = null;
            setStatus('error');
            setErrorMessage('Detection stopped unexpectedly. Reload to try again.');
          }
        }
      }

      if (!cancelled) animationFrame = requestAnimationFrame(detectFrame);
    };

    getCocoModel()
      .then((loadedModel) => {
        if (cancelled) return;
        model = loadedModel;
        if (!cameraFailedRef.current) setStatus('ready');
        animationFrame = requestAnimationFrame(detectFrame);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Could not load the detection model. Check your connection and reload.');
        }
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className="relative h-full min-h-[55dvh] w-full overflow-hidden rounded-xl border border-emerald-400/40 bg-slate-950 shadow-2xl">
      <Webcam
        ref={webcamRef}
        audio={false}
        muted
        mirrored
        playsInline
        videoConstraints={{ facingMode: 'user' }}
        onUserMediaError={() => {
          cameraFailedRef.current = true;
          setStatus('error');
          setErrorMessage('Camera access was denied or no camera is available.');
        }}
        className="h-full w-full object-cover"
      />
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full -scale-x-100 object-cover"
        ref={canvasRef}
      />

      <div className="absolute left-4 top-4 z-20 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs backdrop-blur">
        <span
          className={`mr-2 inline-block h-2 w-2 rounded-full ${
            status === 'ready' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'animate-pulse bg-amber-300'
          }`}
        />
        {status === 'loading'
          ? 'Loading model…'
          : status === 'error'
            ? 'Unavailable'
            : `${detectionCount} object${detectionCount === 1 ? '' : 's'}`}
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="absolute right-4 top-4 z-20 flex rounded-lg bg-slate-950/80 p-1.5 backdrop-blur"
      >
        <label htmlFor="alert-object" className="sr-only">
          Object name to alert for
        </label>
        <input
          id="alert-object"
          type="text"
          onChange={(e) => setAlertToObject(e.target.value)}
          value={alertToObject}
          placeholder="Alert for… e.g. person"
          className="w-40 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-hidden placeholder:text-slate-400 focus:border-primary"
        />
        {alertToObject.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setAlertToObject('')}
            className="ml-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-300"
          >
            Clear
          </button>
        )}
      </form>

      {errorMessage && (
        <div role="alert" className="absolute inset-x-4 bottom-4 z-20 rounded-lg border border-red-400/30 bg-red-950/90 p-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}
    </section>
  );
}

export default CameraDetection;
