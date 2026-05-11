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
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech - Full-Stack Developer, Security, DevOps & Cloud Engineer',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Full-stack development, cloud architecture, modern web solutions. Expert in React, Next.js, Node.js, Terraform, Ansible, Python, Docker, Kubernetes, AWS, and Azure DevOps.',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju' }],
  keywords: ['web development', 'full-stack', 'react', 'next.js', 'cloud', 'aws', 'azure', 'node.js', 'javascript', 'typescript', 'devops', 'security', 'terraform', 'ansible', 'docker', 'kubernetes', 'python', 'monitoring', 'operations', 'zscaler', 'cloudflare', 'supabase', 'PostgreSQL'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
    description: 'Professional web development and cloud engineering services by Raju'
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Raju Tech Blog" />
      </head>
      <body className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
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
