import { CheckCircle, Award, Users, Clock } from 'lucide-react'

const highlights = [
  {
    icon: Award,
    title: 'Licensed CPA',
    description: 'Fully credentialed and in good standing',
  },
  {
    icon: Users,
    title: 'Client-Focused',
    description: 'Personalized attention for every client',
  },
  {
    icon: Clock,
    title: 'Year-Round Support',
    description: 'Available when you need us most',
  },
]

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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <span className="text-accent font-semibold uppercase tracking-wider text-sm">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Your Trusted Partner in Financial Success
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Gordon Ulen CPA has been serving individuals and businesses with
              personalized tax and accounting services for over 25 years. We believe
              that everyone deserves expert financial guidance, delivered with care
              and clarity.
            </p>
            <p className="text-gray-600 text-lg mb-8">
              Our approach combines deep technical expertise with genuine personal
              attention. When you work with us, you work directly with experienced
              professionals who understand your unique situation and goals.
            </p>

            {/* Differentiators */}
            <div className="grid sm:grid-cols-2 gap-3">
              {differentiators.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              <div className="grid gap-6">
                {highlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">25+</div>
                    <div className="text-sm text-gray-500">Years</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">500+</div>
                    <div className="text-sm text-gray-500">Clients</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">99%</div>
                    <div className="text-sm text-gray-500">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-accent/20 rounded-2xl" />
            <div className="absolute -z-20 -top-8 -right-8 w-full h-full bg-primary/10 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
