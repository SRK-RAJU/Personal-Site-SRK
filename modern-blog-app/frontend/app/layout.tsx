import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentProtectionWrapper from '../components/ContentProtectionWrapper';
import { AuthProvider } from '../lib/authContext';
import { Toaster } from 'react-hot-toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'rjexa - DevSecOps & Cloud Engineering',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'DevSecOps insights, cloud architecture, security practices, and infrastructure automation. Expert guidance on containerization, Kubernetes, CI/CD, and cloud-native technologies.',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju SRK @ rjexa inc' }],
  keywords: ['devsecops', 'devops', 'security', 'cloud', 'kubernetes', 'docker', 'ci/cd', 'infrastructure', 'automation', 'web development', 'rjexa', 'cloud architecture', 'security practices'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'rjexa - DevSecOps & Cloud Engineering',
    description: 'Professional DevSecOps insights and cloud engineering practices by rjexa inc'
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@srajukumargoud',
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
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="rjexa" />
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
      </body>
    </html>
  );
}
