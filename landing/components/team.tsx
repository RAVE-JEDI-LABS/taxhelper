import { Mail, Linkedin } from 'lucide-react'

const team = [
  {
    name: 'Gordon Ulen',
    title: 'CPA, Managing Partner',
    credentials: 'CPA, MBA',
    bio: 'With over 25 years of experience, Gordon specializes in tax planning for small businesses and high-net-worth individuals.',
    initials: 'GU',
  },
  {
    name: 'Sarah Mitchell',
    title: 'Senior Tax Accountant',
    credentials: 'CPA, EA',
    bio: 'Sarah brings 15 years of expertise in individual tax preparation and IRS representation.',
    initials: 'SM',
  },
  {
    name: 'Michael Chen',
    title: 'Business Services Manager',
    credentials: 'CPA',
    bio: 'Michael leads our business accounting practice, helping entrepreneurs keep their finances on track.',
    initials: 'MC',
  },
]

export function Team() {
  return (
    <section id="team" className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            Our Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Meet Your Financial Experts
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our experienced team of professionals is dedicated to your financial success.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow"
            >
              {/* Avatar Placeholder */}
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{member.initials}</span>
              </div>

              {/* Info */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-accent font-medium mb-1">{member.title}</p>
              <p className="text-gray-500 text-sm mb-4">{member.credentials}</p>
              <p className="text-gray-600 mb-6">{member.bio}</p>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  aria-label={`Email ${member.name}`}
                >
                  <Mail size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  aria-label={`${member.name} on LinkedIn`}
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
