import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Pool League Manager — Free League Scheduling & Score Tracking Software',
    template: '%s | Pool League Manager',
  },
  description:
    'Free pool league management software for bar leagues and billiards organizations. Auto-generate round-robin schedules, track scores and standings in real time, and manage teams — all from your phone. Replace your spreadsheets today.',
  keywords: [
    'pool league',
    'billiards league',
    'pool league software',
    'pool league manager',
    'bar pool league',
    'league scheduling',
    'pool standings',
    'score tracking',
    'round robin schedule',
    'APA league alternative',
    'BCA league software',
    'tavern pool league',
    'pool league app',
  ],
  metadataBase: new URL('https://pool-league-manager.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pool-league-manager.com',
    siteName: 'Pool League Manager',
    title: 'Pool League Manager — Free League Scheduling & Score Tracking Software',
    description:
      'Free pool league management software. Auto-generate schedules, track scores from your phone, and manage standings in real time. Built for bar and tavern pool leagues.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pool League Manager — Scheduling, Scores & Standings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pool League Manager — Free League Scheduling & Score Tracking',
    description:
      'Free software to manage your pool league. Auto schedules, phone score entry, live standings. Ditch the spreadsheet.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pool League',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Pool League Manager',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    url: 'https://pool-league-manager.com',
    description:
      'Free pool league management software for bar and tavern leagues. Auto-generate round-robin schedules, track scores and standings, and manage teams from your phone.',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free',
        description: '1 league, up to 5 teams, web score entry',
      },
      {
        '@type': 'Offer',
        price: '5',
        priceCurrency: 'USD',
        name: 'Basic',
        description: '1 league, up to 10 teams, full standings',
      },
      {
        '@type': 'Offer',
        price: '10',
        priceCurrency: 'USD',
        name: 'Pro',
        description: 'Player stats, photo scoresheet scanning, 3 years history',
      },
      {
        '@type': 'Offer',
        price: '20',
        priceCurrency: 'USD',
        name: 'Premium',
        description: 'Multiple leagues, unlimited teams, custom branding',
      },
    ],
    featureList: [
      'Round-robin schedule generation',
      'Live standings and rankings',
      'Phone-based score entry',
      'Team and player management',
      'Position night scheduling',
      'Photo scoresheet scanning with OCR',
      'Season history and archives',
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
