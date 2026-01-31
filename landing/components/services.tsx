import {
  FileText,
  Building2,
  TrendingUp,
  Calculator,
  Shield,
  Landmark
} from 'lucide-react'

const services = [
  {
    icon: FileText,
    title: 'Individual Tax Preparation',
    description: 'Comprehensive personal tax returns with maximum deductions and credits. We handle simple to complex returns including investments and rental properties.',
  },
  {
    icon: Building2,
    title: 'Business Tax Returns',
    description: 'Expert preparation for corporations, partnerships, LLCs, and sole proprietors. We understand the unique needs of small businesses.',
  },
  {
    icon: TrendingUp,
    title: 'Tax Planning & Strategy',
    description: 'Proactive year-round planning to minimize your tax burden. We help you make smart financial decisions before year-end.',
  },
  {
    icon: Calculator,
    title: 'Business Bookkeeping Services',
    description: 'Accurate monthly bookkeeping and financial statements. Keep your books organized and ready for tax season all year.',
  },
  {
    icon: Shield,
    title: 'IRS Representation',
    description: 'Professional representation for audits, collections, and disputes. We communicate with the IRS on your behalf.',
  },
  {
    icon: Landmark,
    title: 'Estate & Trust Taxes',
    description: 'Specialized tax preparation for estates, trusts, and inheritances. Navigate complex tax situations with confidence.',
  },
]

export function Services() {
  return (
    <section id="services" className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Comprehensive Tax & Accounting Solutions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            From individual returns to complex business needs, we provide personalized
            service tailored to your unique financial situation.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 bg-gray-50 rounded-2xl hover:bg-primary hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                <service.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-white transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 group-hover:text-white/80 transition-colors">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a href="#contact" className="btn-primary">
            Get a Free Consultation
          </a>
        </div>
      </div>
    </section>
  )
}
