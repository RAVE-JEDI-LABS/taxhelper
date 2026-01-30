'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'What documents do I need to bring for my tax preparation?',
    answer: 'For individual returns, you\'ll need: W-2s from all employers, 1099 forms for other income, last year\'s tax return, Social Security numbers for all family members, receipts for deductible expenses, and any other income documentation. We\'ll provide a detailed checklist specific to your situation after our initial consultation.',
  },
  {
    question: 'How much does tax preparation cost?',
    answer: 'Our fees vary based on the complexity of your return. Simple individual returns start at $200, while business returns and more complex individual situations are priced based on the work required. We provide a clear estimate upfront after reviewing your situation - no surprises.',
  },
  {
    question: 'How long does it take to complete my tax return?',
    answer: 'For most individual returns, we complete preparation within 3-5 business days once we have all documents. Business returns typically take 1-2 weeks. During peak tax season (March-April), timelines may be slightly longer. We\'ll always give you a specific timeline for your situation.',
  },
  {
    question: 'Do you handle IRS audits?',
    answer: 'Yes, IRS representation is one of our specialties. If you receive an audit notice, contact us immediately. We\'ll review your situation, communicate with the IRS on your behalf, and guide you through the entire process. Audit support is included for returns we prepare.',
  },
  {
    question: 'Can I file my taxes electronically?',
    answer: 'Absolutely. We e-file all eligible returns, which is faster and more secure than paper filing. You\'ll typically receive your refund within 2-3 weeks with direct deposit. We also offer secure digital document upload through our client portal.',
  },
  {
    question: 'Do you offer year-round services or just during tax season?',
    answer: 'We\'re here for you year-round. While tax preparation is busiest January through April, we provide bookkeeping, tax planning, and consultation services throughout the year. Proactive planning before year-end can significantly reduce your tax burden.',
  },
  {
    question: 'What makes Gordon Ulen CPA different from other tax preparers?',
    answer: 'You work directly with experienced CPAs, not seasonal preparers. We focus on building long-term relationships and understanding your complete financial picture. Our approach combines technical expertise with genuine personal attention, and we\'re available when you need us.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Got questions? We've got answers. If you don't see what you're looking for,
            feel free to contact us.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                )}
              >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a href="#contact" className="btn-primary">
            Contact Us
          </a>
        </div>
      </div>
    </section>
  )
}
