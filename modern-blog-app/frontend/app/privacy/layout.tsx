import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - rjexa',
  description: 'Privacy policy for rjexa.com. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
