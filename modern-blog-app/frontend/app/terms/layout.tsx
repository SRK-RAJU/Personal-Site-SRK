import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Personal Tech Blog',
  description: 'Terms of service for this personal tech blog. Read our usage policies and legal agreements.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
