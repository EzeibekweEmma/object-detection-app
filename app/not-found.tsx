import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <main className="grid min-h-[calc(100dvh-5rem)] place-items-center bg-slate-950 px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-slate-400">The page you requested does not exist.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          Return to detection
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
