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
  const [percentage, setPercentage] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const randomPercentage = (Math.random() * 10).toFixed(1);
    setPercentage(Number(randomPercentage));
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
      onClick={() =>
        router.push(`?${createQueryString('mode', text.toLowerCase())}`)
      }
    >
      <span className="absolute -top-4 hidden group-hover:block left-0 text-primary text-xs">
        {text}:&nbsp;9{percentage}%
      </span>
      <div
        className={clsx('h-8 w-8 group-hover:border border-primary', {
          'text-primary': mode === text.toLowerCase(),
        })}
      >
        {icon}
      </div>
    </button>
  );
}

export default TextDetectBtn;
