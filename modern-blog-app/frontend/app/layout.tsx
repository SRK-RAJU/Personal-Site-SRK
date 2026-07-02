import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentProtectionWrapper from '../components/ContentProtectionWrapper';
// 🌟 FIXED: పాత AIBlogGenerator ఇంపోర్ట్‌ని పూర్తిగా తీసేశాం
import { AuthProvider } from '../lib/authContext';
import { Toaster } from 'react-hot-toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com'),
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech - Full-Stack Developer, Security, DevOps & Cloud Engineer',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Personal tech blog exploring AI-generated content, cloud engineering, security, and modern web development. Insights on React, Next.js, Node.js, Terraform, Ansible, Python, Docker, Kubernetes, AWS, and Azure DevOps.',
  authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR || 'Raju' }],
  keywords: ['personal blog', 'tech blog', 'cloud engineering', 'full-stack', 'react', 'next.js', 'node.js', 'typescript', 'devops', 'security', 'terraform', 'ansible', 'docker', 'kubernetes', 'aws', 'azure', 'python', 'monitoring', 'cloudflare', 'supabase', 'postgresql'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rjexa.com',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Raju Tech',
    description: 'Personal tech blog for AI-generated content, cloud engineering, DevOps and modern web development.'
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
      <body className="flex flex-col min-h-screen bg-gradient-to-br from-white via-violet-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <a href="#main-content" className="skip-link focus-visible:outline-none">
          Skip to main content
        </a>
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
            <main id="main-content" className="flex-1 w-full pt-16 sm:pt-20">
              {children}
            </main>
            <Footer />
            {/* 🌟 FIXED: ఇక్కడున్న <AIBlogGenerator /> ట్యాగ్‌ని పూర్తిగా డిలీట్ చేసాం */}
          </AuthProvider>
        </ContentProtectionWrapper>
      </body>
    </html>
  );
}