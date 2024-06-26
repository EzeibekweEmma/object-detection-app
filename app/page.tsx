'use client';

import { useSearchParams } from 'next/navigation';
import CameraDetection from '@/components/CameraDetection';
import { ImageDetection } from '@/components/ImageDetection';

export default function Home() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode')?.toLowerCase();

  return (
    <main className="flex items-center justify-center h-full w-full md:py-5 md:pr-5 p-5 md:p-0">
      <section className="h-fit md:h-full relative">
        <span className="absolute -top-4 left-0 text-primary text-xs">
          Frame:&nbsp;99.9%
        </span>

        {/* Detection mode goes here! */}
        {mode === 'image' ? (
          <div className="h-full w-full border border-primary">
            <ImageDetection />
          </div>
        ) : (
          <CameraDetection />
        )}
      </section>
    </main>
  );
}
