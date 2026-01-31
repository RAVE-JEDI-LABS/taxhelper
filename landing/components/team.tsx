import Image from 'next/image'
import { Award, Users, Clock, ShieldCheck } from 'lucide-react'

const credentials = [
  {
    icon: Award,
    title: 'Licensed CPA',
    description: 'Fully credentialed and in good standing with the state board',
  },
  {
    icon: Users,
    title: 'Client-Focused',
    description: 'Personalized attention for every individual and business',
  },
  {
    icon: Clock,
    title: 'Year-Round Support',
    description: 'Available when you need us, not just during tax season',
  },
  {
    icon: ShieldCheck,
    title: 'IRS Enrolled',
    description: 'Authorized to represent clients before the IRS',
  },
]

export function Team() {
  return (
    <section id="team" className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Expertise You Can Trust
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            With decades of experience, Gordon W. Ulen provides the expertise and personal attention your finances deserve.
          </p>
        </div>

        {/* Credentials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {credentials.map((item) => (
            <div
              key={item.title}
              className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Office Dog - Fun Touch */}
        <div className="text-center">
          <div className="inline-block bg-accent-50 rounded-2xl p-6 max-w-md">
            <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src="/images/office-dog.jpg"
                alt="Office Dog"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-700 font-medium">Our Office Greeter</p>
            <p className="text-gray-500 text-sm">Making tax season a little less ruff!</p>
          </div>
        </div>
      </div>
    </section>
  )
}
