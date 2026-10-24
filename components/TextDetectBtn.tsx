import clsx from 'clsx';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';

function TextDetectBtn({
  icon,
  text,
  mode,
}: {
  icon: React.ReactNode;
  text: string;
  mode?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = text.toLowerCase();

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
      type="button"
      aria-label={`Use ${text.toLowerCase()} detection`}
      aria-current={mode === value ? 'page' : undefined}
      className="group relative"
      onClick={() => mode && router.push(`?${createQueryString('mode', value)}`)}
    >
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-visible:block md:bottom-auto md:left-full md:top-1/2 md:mb-0 md:ml-3 md:-translate-y-1/2 md:translate-x-0">
        {text} detection
      </span>
      <div
        className={clsx(
          'h-10 w-10 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white',
          {
            'bg-emerald-400/10 text-primary ring-1 ring-primary/50': mode === value,
          }
        )}
      >
        {icon}
      </div>
    </button>
  );
}

export default TextDetectBtn;
