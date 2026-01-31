import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AIAssistant } from '@/components/ai-assistant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gordon Ulen CPA | Expert Tax Preparation & Financial Guidance',
  description: 'Trusted tax preparation, business accounting, and financial planning services. Expert CPAs helping individuals and businesses achieve their financial goals.',
  keywords: 'CPA, tax preparation, accountant, tax planning, bookkeeping, business taxes, IRS representation',
  openGraph: {
    title: 'Gordon Ulen CPA | Expert Tax Preparation & Financial Guidance',
    description: 'Trusted tax preparation, business accounting, and financial planning services.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AIAssistant />
      </body>
    </html>
  )
}
