'use client';

import { HiOutlineCamera } from 'react-icons/hi2';
import TextDetectBtn from './TextDetectBtn';
import { IoImageOutline } from 'react-icons/io5';
import { useSearchParams } from 'next/navigation';

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
    <div className="md:h-full h-16 md:w-16 w-full flex md:flex-col gap-7 justify-center items-center">
      {iconsBtn.map(({ icon, text }) => {
        return <TextDetectBtn key={text} text={text} icon={icon} mode={mode} />;
      })}
    </div>
  );
}

export default SideBar;
