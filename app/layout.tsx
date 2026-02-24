import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ParkingMS — Smart Parking Management',
  description: 'AI-powered parking management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
