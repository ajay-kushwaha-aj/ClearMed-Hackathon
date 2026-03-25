import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import PwaInstaller from '@/components/PwaInstaller';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: { default: 'ClearMed — Smarter Choices. Better Care.', template: '%s | ClearMed' },
  description: 'Smarter Choices. Better Care. Compare verified hospital costs across India. Find the best hospital for your treatment with real patient data.',
  keywords: ['hospital cost comparison India', 'treatment cost Delhi', 'healthcare transparency', 'best hospital India', 'cashless hospital insurance'],
  authors: [{ name: 'ClearMed' }],
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ClearMed' },
  formatDetection: { telephone: false },
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'ClearMed', title: 'ClearMed — Transparent Healthcare Costs', description: 'Compare verified hospital costs across India.' },
};

export const viewport: Viewport = {
  themeColor: '#0e87ef',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning className={`${outfit.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        {children}
        <CookieBanner />
        <PwaInstaller />
      </body>
    </html>
  );
}