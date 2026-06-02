import type { Metadata, Viewport } from 'next';
import { Exo_2, Chakra_Petch } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Body/UI — Exo 2: techy, sporty, highly readable at small sizes.
const body = Exo_2({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// Display (headings + financial numbers) — Chakra Petch: sci-fi/HUD, stylish but legible.
const display = Chakra_Petch({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Your lifetime personal finance companion',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B14' },
  ],
};

// Pre-hydration: set the dark class before paint to avoid a theme flash.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('personal-finance-tracker-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
