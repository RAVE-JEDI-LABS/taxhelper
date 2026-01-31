import Image from 'next/image'
import { CheckCircle } from 'lucide-react'

const differentiators = [
  'Direct access to your CPA, not a call center',
  'Same-day response during tax season',
  'Proactive tax planning, not just preparation',
  'Clear, upfront pricing with no surprises',
  'Secure digital document portal',
  'IRS audit support included',
]

export function About() {
  return (
    <section id="about" className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/vision.png"
                alt="Focusing on your financial future"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
              />
              {/* Overlay text */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-900/90 to-transparent p-6">
                <p className="text-white text-lg font-medium">Focusing on your financial future</p>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -z-10 -bottom-4 -left-4 w-full h-full bg-accent/20 rounded-2xl" />
            <div className="absolute -z-20 -bottom-8 -left-8 w-full h-full bg-primary/10 rounded-2xl" />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="text-accent font-semibold uppercase tracking-wider text-sm">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Your Trusted Partner in Financial Success
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Gordon W. Ulen CPA has been serving individuals and businesses with
              personalized tax and accounting services for over 25 years. We believe
              that everyone deserves expert financial guidance, delivered with care
              and clarity.
            </p>
            <p className="text-gray-600 text-lg mb-8">
              Our approach combines deep technical expertise with genuine personal
              attention. When you work with us, you work directly with an experienced
              professional who understands your unique situation and goals.
            </p>

            {/* Differentiators */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {differentiators.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-4xl font-bold text-primary">25+</div>
                <div className="text-sm text-gray-500">Years Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-500">Happy Clients</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">99%</div>
                <div className="text-sm text-gray-500">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
