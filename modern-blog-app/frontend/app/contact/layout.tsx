import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - rjexa inc',
  description: 'Get in touch with rjexa for DevSecOps consulting, cloud architecture, or technical discussions. Reach out to Raju SRK.[https://rjexa.com/contact]',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
