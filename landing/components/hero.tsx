import Image from 'next/image'
import { Calendar, Phone, LogIn } from 'lucide-react'

export function Hero() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || '(978) 372-7050'
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '#contact'
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || '/portal'

  return (
    <section className="relative min-h-screen flex items-center bg-primary-900 pt-20">
      <div className="container-custom relative py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-medium mb-6 border border-accent/30">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Accepting New Clients for 2025 Tax Season
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Expert Tax Preparation &{' '}
              <span className="text-accent">Financial Guidance</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-xl mx-auto lg:mx-0">
              Trusted by families and businesses for personalized tax solutions and
              strategic financial planning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <a
                href={calendlyUrl}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar size={20} />
                Book Appointment
              </a>
              <a
                href={portalUrl}
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Client Portal
              </a>
              <a
                href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
                className="btn-accent w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                {phoneNumber}
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center">
                  <span className="text-accent font-bold text-sm">25+</span>
                </div>
                <span className="text-sm">Years Experience</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center">
                  <span className="text-accent font-bold text-sm">500+</span>
                </div>
                <span className="text-sm">Happy Clients</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Image with Gold Frame */}
              <div
                className="relative w-44 md:w-56 lg:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-accent bg-primary-800"
              >
                <Image
                  src="/images/gordon-ulen.jpg"
                  alt="Gordon W. Ulen, CPA"
                  fill
                  className="object-cover object-top"
                  priority
                />
                {/* Gradient overlay for better text contrast on badge */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-[calc(100%-1rem)] h-[calc(100%-1rem)] bg-accent/10 rounded-2xl blur-sm" />
              <div className="absolute -z-20 -bottom-8 -right-8 w-[calc(100%-2rem)] h-[calc(100%-2rem)] bg-accent/5 rounded-2xl blur-md" />

              {/* Name badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-accent px-6 py-3 rounded-xl shadow-xl border-2 border-accent-300 backdrop-blur-sm">
                <p className="font-bold text-primary-900 text-lg">Gordon W. Ulen</p>
                <p className="text-xs text-primary-800 font-medium">Certified Public Accountant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
        <a href="#services" className="text-accent hover:text-accent-300 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  )
}
