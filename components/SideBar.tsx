'use client';

import { HiOutlineCamera } from 'react-icons/hi2';
import TextDetectBtn from './TextDetectBtn';
import { IoImageOutline } from 'react-icons/io5';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SideBar() {
  const searchParams = useSearchParams();
  let mode = searchParams.get('mode')?.toLowerCase();

  const iconsBtn = [
    { icon: <HiOutlineCamera className="h-full w-full" />, text: 'Camera' },
    { icon: <IoImageOutline className="h-full w-full" />, text: 'Image' },
  ];

  // If the mode is not set, set the mode to camera
  if (!mode) mode = 'camera';
  if (!iconsBtn.some(({ text }) => text.toLowerCase() === mode))
    mode = 'camera';

  return (
    <nav aria-label="Detection mode" className="flex h-16 w-full items-center justify-center gap-3 border-t border-slate-800 bg-slate-950 md:h-full md:w-20 md:flex-col md:border-r md:border-t-0">
      {iconsBtn.map(({ icon, text }) => {
        return <TextDetectBtn key={text} text={text} icon={icon} mode={mode} />;
      })}
    </nav>
  );
}

export default function SuspendedSideBar() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-slate-950 md:h-full md:w-20" />}>
      <SideBar />
    </Suspense>
  );
}
