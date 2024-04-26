import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SideBar from '@/components/SideBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Object Detection',
  description: 'Custom Object Detection Using TensorFlow.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-dvh`}>
        <header className="flex items-center justify-center h-20 bg-gray-800">
          <div>
            <span className="text-primary text-xs">Text:&nbsp;99.9%</span>
            <h1 className="font-semibold text-xl border -mt-1 border-primary px-0.5">
              Object Detection
            </h1>
          </div>
        </header>
        <section className="flex h-[89.7dvh] gap-2">
          <SideBar />
          {children}
        </section>
      </body>
    </html>
  );
}
