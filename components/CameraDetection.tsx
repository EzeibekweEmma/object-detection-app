'use client';

import { renderPredictions } from '@/utils/render-predictions';
import { load, ObjectDetection } from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

function CameraDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [detectInterval, setDetectInterval] = useState<NodeJS.Timeout>();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function startCoco() {
    setIsLoading(true);
    try {
      await tf.setBackend('webgl'); // Register the WebGL backend
      tf.ready();
      const model = await load();
      setIsLoading(false);
      const interval = setInterval(() => {
        runDetection(model);
      }, 10);
      setDetectInterval(interval);
    } catch (error) {
      console.error('Error loading model:', error);
      setIsLoading(false);
    }
  }

  async function runDetection(model: ObjectDetection) {
    if (
      canvasRef.current &&
      (webcamRef.current as any).video.readyState === 4
    ) {
      const myVideoWidth = (webcamRef.current as any).video.videoWidth;
      const myVideoHeight = (webcamRef.current as any).video.videoHeight;

      (canvasRef.current as any).width = myVideoWidth;
      (canvasRef.current as any).height = myVideoHeight;
      // find detected objects
      try {
        const detectedObjects = await model.detect(
          (webcamRef.current as any).video,
          undefined,
          0.6 // A threshold of 0.6 is used to determine the confidence of the detected objects.
        );

        const context = (canvasRef.current as any).getContext('2d');
        renderPredictions(detectedObjects, context);
      } catch (error) {
        console.error('Error detecting objects:', error);
      }
    }
  }

  useEffect(() => {
    startCoco();
    return () => {
      if (detectInterval) {
        clearInterval(detectInterval);
      }
    };
  }, [detectInterval, startCoco]);

  return (
    <>
      <Webcam
        ref={webcamRef}
        audio={false}
        muted
        className="h-full w-full border-2 border-primary"
      />
      <canvas
        className="absolute top-0 left-0 z-50 h-full w-full"
        ref={canvasRef}
      />
    </>
  );
}

export default CameraDetection;
