import '../styles/globals.css';
import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentProtectionWrapper from '../components/ContentProtectionWrapper';
import { AuthProvider } from '../lib/authContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Tech Blog & Portfolio',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Modern tech blog with cloud, security, and DevOps insights',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju SRK' }],
  keywords: ['tech', 'blog', 'portfolio', 'web development', 'cloud', 'devops', 'security'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Tech Blog',
  },
  twitter: {
    card: 'summary_large_image',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
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
            <main className="flex-1 w-full pt-20">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ContentProtectionWrapper>
      </body>
    </html>
  );
}
