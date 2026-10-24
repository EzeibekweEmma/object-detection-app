'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CameraDetection from '@/components/CameraDetection';
import { ImageDetection } from '@/components/ImageDetection';

function DetectionSection() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode')?.toLowerCase();

  return (
    <section className="relative h-full w-full">
      {mode === 'image' ? <ImageDetection /> : <CameraDetection />}
    </section>
  );
}

export default function Home() {
  return (
    <main className="h-full min-w-0 flex-1 p-3 md:p-5">
      <Suspense fallback={<div className="h-full w-full animate-pulse rounded-xl bg-slate-900" />}>
        <DetectionSection />
      </Suspense>
    </main>
  );
}
