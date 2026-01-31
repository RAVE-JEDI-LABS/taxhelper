import { Facebook, Linkedin, Twitter } from 'lucide-react'

const quickLinks = [
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About Us' },
  { href: '#team', label: 'Our Team' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
]

const services = [
  'Individual Tax Preparation',
  'Business Tax Returns',
  'Tax Planning',
  'Bookkeeping',
  'IRS Representation',
]

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || '(978) 372-7050'
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || '/portal'

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white">
                Gordon W. Ulen, <span className="font-normal text-gray-400">CPA</span>
              </span>
            </a>
            <p className="text-gray-400 mb-6">
              Expert tax preparation and financial guidance for individuals and
              businesses. Your success is our priority.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={portalUrl}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Client Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                6 Chestnut St Suite 106
                <br />
                Amesbury, MA 01913
              </li>
              <li>
                <a
                  href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {phoneNumber}
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@gordonulencpa.com"
                  className="hover:text-white transition-colors"
                >
                  info@gordonulencpa.com
                </a>
              </li>
              <li>
                Mon - Fri: 9am - 5pm
                <br />
                Sat: By Appointment
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} Gordon Ulen CPA. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
