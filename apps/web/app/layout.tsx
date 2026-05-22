import '@repo/ui/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://casespace.vercel.app',
  ),
  title: 'CaseSpace — Investigative Case Intelligence',
  description:
    'CaseSpace is a desktop-first fraud examination workspace for CFEs and investigative professionals. Offline, secure, and built for evidence review, findings, and defensible reports.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CaseSpace',
    description:
      'Investigative case intelligence built for speed and security.',
    images: ['/casespace-owl-icon.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={geist.className}>
        <header className='border-b border-neutral-800 px-6 py-4'>
          <nav className='mx-auto max-w-5xl flex items-center gap-6 text-sm'>
            <Link
              href='/'
              className='flex items-center gap-2 font-semibold text-base'
              aria-label='CaseSpace home'
            >
              <Image
                src='/casespace-owl-icon.png'
                alt=''
                width={32}
                height={32}
                priority
                className='drop-shadow-sm'
              />
              <span>CaseSpace</span>
            </Link>
            <div className='flex flex-1 items-center justify-end gap-5'>
              <Link className='hover:text-white' href='/download'>
                Download
              </Link>
              <Link className='hover:text-white' href='/docs'>
                Docs
              </Link>
              <Link className='hover:text-white' href='/pricing'>
                Pricing
              </Link>
              <Link className='hover:text-white' href='/contact'>
                Contact
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className='border-t border-neutral-800 px-6 py-8 mt-16'>
          <div className='mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400'>
            <div className='flex items-center gap-2'>
              <Image
                src='/casespace-owl-icon.png'
                alt=''
                width={20}
                height={20}
              />
              <span>
                © {new Date().getFullYear()} CaseSpace. All rights reserved.
              </span>
            </div>
            <div className='flex gap-4'>
              <a
                href='https://github.com/fletchertyler914/casespace/blob/main/LICENSE'
                className='hover:text-white'
              >
                License (BUSL-1.1)
              </a>
              <a
                href='https://github.com/fletchertyler914/casespace/blob/main/COMMERCIAL-LICENSE.md'
                className='hover:text-white'
              >
                Commercial Use
              </a>
              <a
                href='https://github.com/fletchertyler914/casespace'
                className='hover:text-white'
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
      <Analytics />
    </html>
  );
}
