'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CameraDetection from '@/components/CameraDetection';
import { ImageDetection } from '@/components/ImageDetection';

function DetectionSection() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode')?.toLowerCase();

  return (
    <section className="h-fit md:h-full relative">
      <span className="absolute -top-4 left-0 text-primary text-xs">
        Frame:&nbsp;99.9%
      </span>

      {/* Detection mode goes here! */}
      {mode === 'image' ? <ImageDetection /> : <CameraDetection />}
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex items-center justify-center h-full w-full md:py-5 md:pr-5 p-5 md:p-0">
      <Suspense fallback={<div>Loading...</div>}>
        <DetectionSection />
      </Suspense>
    </main>
  );
}
