import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AIAssistantWrapper } from '@/components/ai-assistant-wrapper';
import { SubdomainRouter } from '@/components/subdomain-router';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gordon Ulen CPA - Tax Helper',
  description: 'Tax preparation workflow automation system',
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
          <SubdomainRouter />
          {children}
          <AIAssistantWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
