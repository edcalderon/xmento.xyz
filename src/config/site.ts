import { Metadata } from 'next';

export const siteConfig: Metadata = {
  title: {
    default: 'Xmento.xyz | StableFX on Celo',
    template: '%s | Xmento.xyz',
  },
  description: 'Earn optimal yields on your stablecoins with Xmento\'s automated rebalancing on Celo. Maximize your returns with our DeFi yield optimization platform.',
  applicationName: 'Xmento.xyz',
  keywords: ['DeFi', 'Celo', 'Stablecoins', 'Yield Farming', 'Automated Rebalancing', 'Celo Blockchain'],
  authors: [{ name: 'Xmento Team' }],
  creator: 'Xmento',
  publisher: 'Xmento',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://xmento.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Xmento.xyz | StableFX on Celo',
    description: 'Earn optimal yields on your stablecoins with Xmento\'s automated rebalancing on Celo.',
    url: 'https://xmento.xyz',
    siteName: 'Xmento.xyz',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Xmento - StableFX on Celo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xmento.xyz | StableFX on Celo',
    description: 'Earn optimal yields on your stablecoins with Xmento\'s automated rebalancing on Celo.',
    images: ['/twitter-image.jpg'],
    creator: '@xmentoxyz',
    site: '@xmentoxyz',
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
