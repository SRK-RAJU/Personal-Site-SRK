import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Raju',
  description: 'Get in touch with Raju for personal tech discussions, cloud learning, and developer collaboration. Reach out to share ideas or ask questions.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
