'use client';

import type { Detection } from '@/utils/detection-types';
import { getObjectDetector } from '@/utils/object-detector';
import Image from 'next/image';
import { DragEvent, ChangeEvent, useEffect, useRef, useState } from 'react';
import { LiaSpinnerSolid } from 'react-icons/lia';
import { LuCloudUpload, LuImagePlus, LuX } from 'react-icons/lu';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type SelectedImage = {
  url: string;
  width: number;
  height: number;
  name: string;
};

export function ImageDetection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [predictions, setPredictions] = useState<Detection[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage.url);
    };
  }, [selectedImage]);

  const selectImage = async (file?: File) => {
    if (!file) return;
    setError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Choose an image smaller than 10 MB.');
      return;
    }

    setLoading(true);
    setPredictions([]);
    const url = URL.createObjectURL(file);
    const imageElement = document.createElement('img');

    try {
      await new Promise<void>((resolve, reject) => {
        imageElement.onload = () => resolve();
        imageElement.onerror = () => reject(new Error('The image could not be read.'));
        imageElement.src = url;
      });

      const model = await getObjectDetector();
      const results = await model.detect(imageElement, {
        maxDetections: 20,
        scoreThreshold: 0.45,
      });
      setSelectedImage({
        url,
        width: imageElement.naturalWidth,
        height: imageElement.naturalHeight,
        name: file.name,
      });
      setPredictions(results);
    } catch {
      URL.revokeObjectURL(url);
      setError('Could not analyze this image. Please try another one.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPredictions([]);
    setError('');
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void selectImage(event.dataTransfer.files[0]);
  };

  return (
    <section className="relative flex h-full min-h-[55dvh] w-full items-center justify-center overflow-hidden rounded-xl border border-emerald-400/40 bg-slate-950 p-4 shadow-2xl">
      {selectedImage ? (
        <div className="relative inline-block max-h-full max-w-full">
          <Image
            width={selectedImage.width}
            height={selectedImage.height}
            className="max-h-[calc(89dvh-7rem)] w-auto max-w-full rounded-lg object-contain"
            alt={`Uploaded image: ${selectedImage.name}`}
            src={selectedImage.url}
            unoptimized
          />
          {predictions.map((prediction, index) => {
            const [x, y, width, height] = prediction.bbox;
            return (
              <div
                key={`${prediction.class}-${index}`}
                className="pointer-events-none absolute border-2 border-primary"
                style={{
                  left: `${(x / selectedImage.width) * 100}%`,
                  top: `${(y / selectedImage.height) * 100}%`,
                  width: `${(width / selectedImage.width) * 100}%`,
                  height: `${(height / selectedImage.height) * 100}%`,
                }}
              >
                <span className="absolute -left-0.5 bottom-full whitespace-nowrap bg-primary px-1.5 py-0.5 text-xs font-semibold text-slate-950">
                  {prediction.class} {(prediction.score * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full max-w-xl flex-col items-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
            isDragging ? 'border-primary bg-emerald-400/10' : 'border-slate-700 bg-slate-900/50'
          }`}
        >
          <LuCloudUpload className="mb-4 h-12 w-12 text-primary" />
          <h2 className="text-lg font-semibold text-white">Drop an image here</h2>
          <p className="mt-1 text-sm text-slate-400">JPG, PNG, or WebP up to 10 MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? <LiaSpinnerSolid className="h-5 w-5 animate-spin" /> : <LuImagePlus className="h-5 w-5" />}
            {isLoading ? 'Analyzing…' : 'Choose image'}
          </button>
        </div>
      )}

      {selectedImage && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          <span className="rounded-full bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
            {predictions.length} object{predictions.length === 1 ? '' : 's'} found
          </span>
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            className="rounded-lg bg-slate-950/80 p-2 text-white backdrop-blur hover:bg-slate-800"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute inset-x-4 bottom-4 rounded-lg border border-red-400/30 bg-red-950/90 p-3 text-center text-sm text-red-100">
          {error}
        </div>
      )}

      <input
        hidden
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        ref={fileInputRef}
        onChange={(event: ChangeEvent<HTMLInputElement>) => void selectImage(event.target.files?.[0])}
      />
    </section>
  );
}
