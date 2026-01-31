import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AIAssistantWrapper } from '@/components/ai-assistant-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gordon Ulen CPA - Admin',
  description: 'Tax Helper Admin Portal - Staff dashboard for tax preparation workflow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AIAssistantWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
