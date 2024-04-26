import clsx from 'clsx';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function TextDetectBtn({
  icon,
  text,
  mode,
}: {
  icon: React.ReactNode;
  text: string;
  mode: string;
}) {
  const [percentage, setPercentage] = useState<string>('0%');
  const router = useRouter();
  const searchParams = useSearchParams();
  text = text.toLowerCase();

  useEffect(() => {
    const randomPercentage = `${Number((Math.random() * 10).toFixed(1)) + 90}%`;
    setPercentage(randomPercentage);
  }, []);

  const createQueryString = useCallback(
    // This function is used to create a query string with the mode parameter
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  return (
    <button
      className="relative group"
      onClick={() => router.push(`?${createQueryString('mode', text)}`)}
    >
      <span className="absolute -top-4 z-10 hidden group-hover:block left-0 text-primary text-xs capitalize">
        {text}:&nbsp;{percentage}
      </span>
      <div
        className={clsx('h-8 w-8 group-hover:border border-primary', {
          'text-primary': mode === text,
        })}
      >
        {icon}
      </div>
    </button>
  );
}

export default TextDetectBtn;
