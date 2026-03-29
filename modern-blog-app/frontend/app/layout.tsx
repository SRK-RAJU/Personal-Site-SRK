import '../styles/globals.css';
import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentProtectionWrapper from '../components/ContentProtectionWrapper';
import { AuthProvider } from '../lib/authContext';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Tech Blog & Portfolio - Raju SRK',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Modern futuristic tech blog with cloud, security, and DevOps insights. Explore cutting-edge web development practices.',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju SRK' }],
  keywords: ['tech', 'blog', 'portfolio', 'web development', 'cloud', 'devops', 'security', 'react', 'next.js', 'typescript', 'futuristic'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Tech Blog',
    description: 'Modern futuristic tech blog with advanced features and responsive design',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@srajukumargoud',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Raju SRK" />
      </head>
      <body className="flex flex-col min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <ContentProtectionWrapper>
          <AuthProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 4000,
              }}
            />
            <Header />
            <main className="flex-1 w-full pt-16 sm:pt-20">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ContentProtectionWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}
