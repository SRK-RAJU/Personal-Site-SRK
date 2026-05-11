import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Raju SRK',
  description: 'Get in touch with Raju for DevSecOps consulting, cloud architecture, or technical discussions. Reach out to discuss your projects and ideas.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
