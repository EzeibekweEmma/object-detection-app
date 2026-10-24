import type { Metadata } from 'next';
import './globals.css';
import SideBar from '@/components/SideBar';

export const metadata: Metadata = {
  title: 'Object Detection',
  description: 'Private, in-browser object detection powered by COCO-SSD',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="h-dvh overflow-hidden bg-slate-950 font-sans text-white"
      >
        <header className="flex h-16 items-center border-b border-slate-800 bg-slate-950 px-5 md:h-20 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-black text-slate-950">OD</div>
            <div>
              <h1 className="font-semibold leading-tight">Object Detection</h1>
              <p className="text-xs text-slate-400">Private, in-browser detection</p>
            </div>
          </div>
        </header>
        <section className="flex h-[calc(100dvh-4rem)] flex-col-reverse md:h-[calc(100dvh-5rem)] md:flex-row">
          <SideBar />
          {children}
        </section>
      </body>
    </html>
  );
}
