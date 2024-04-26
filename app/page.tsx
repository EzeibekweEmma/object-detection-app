'use client';

import Webcam from 'react-webcam';

export default function Home() {
  return (
    <main className="flex items-center justify-center h-full w-full md:py-5 md:pr-5 p-5 md:p-0">
      <section className="h-fit md:h-full relative">
        <span className="absolute -top-4 left-0 text-primary text-xs">
          Frame:&nbsp;99.9%
        </span>
        <Webcam
          audio={false}
          mirrored={true}
          muted
          className="h-full w-full border-2 border-primary"
        />
      </section>
    </main>
  );
}
