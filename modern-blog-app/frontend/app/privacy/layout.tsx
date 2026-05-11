import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Personal Tech Blog',
  description: 'Privacy policy for this personal tech blog. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
