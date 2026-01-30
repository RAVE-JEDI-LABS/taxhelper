import { Calendar, Phone, LogIn } from 'lucide-react'

export function Hero() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || '(978) 372-7050'
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '#contact'
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || '/portal'

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a5f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative pt-24 md:pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            Accepting New Clients for 2025 Tax Season
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Expert Tax Preparation &{' '}
            <span className="text-primary">Financial Guidance</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Trusted by families and businesses for personalized tax solutions and
            strategic financial planning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
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
              Call {phoneNumber}
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">25+</span>
              </div>
              <span className="text-sm">Years Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-accent-700 font-bold">500+</span>
              </div>
              <span className="text-sm">Happy Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-bold">A+</span>
              </div>
              <span className="text-sm">BBB Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#services" className="text-gray-400 hover:text-primary transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  )
}
