import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - rjexa',
  description: 'Terms of service for rjexa.com. Read our usage policies and legal agreements.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
