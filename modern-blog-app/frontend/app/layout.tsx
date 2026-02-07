import '../styles/globals.css';
import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Tech Blog & Portfolio',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Tech blog and portfolio website',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju SRK' }],
  keywords: ['tech', 'blog', 'portfolio', 'web development'],
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
      </head>
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
