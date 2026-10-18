import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SiteMain from '../components/SiteMain';
import ContentProtectionWrapper from '../components/ContentProtectionWrapper';
import Providers from '../components/Providers';
import { AuthProvider } from '../lib/authContext';
import { Toaster } from 'react-hot-toast';

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fontDisplay = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050811' },
    { media: '(prefers-color-scheme: light)', color: '#f4f7fc' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com'),
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal tech blog on AI, cloud, security, and modern web development.',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju' }],
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal tech blog on AI, cloud, security, and modern web development.',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal tech blog on AI, cloud, security, and modern web development.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Raju Tech Blog" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <div className="app-bg" aria-hidden="true" />
        <a href="#main-content" className="skip-link focus-visible:outline-none">
          Skip to main content
        </a>
        <Providers>
          <ContentProtectionWrapper>
            <AuthProvider>
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgb(var(--bg-rgb))',
                    color: 'rgb(var(--fg-rgb))',
                    border: '1px solid var(--line-strong)',
                    borderRadius: '0.9rem',
                  },
                }}
              />
              <Header />
              <SiteMain>{children}</SiteMain>
              <Footer />
            </AuthProvider>
          </ContentProtectionWrapper>
        </Providers>
      </body>
    </html>
  );
}