import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Gordon and his team have handled my business taxes for over 10 years. Their attention to detail and proactive planning has saved us thousands. I wouldn't trust anyone else.",
    name: 'Jennifer Martinez',
    title: 'Small Business Owner',
    rating: 5,
  },
  {
    quote: "After years of doing my own taxes, I finally switched to Gordon Ulen CPA. Best decision ever. They found deductions I never knew existed and made the whole process stress-free.",
    name: 'Robert Thompson',
    title: 'Individual Client',
    rating: 5,
  },
  {
    quote: "When I got an IRS audit notice, I panicked. Sarah took over completely and resolved everything professionally. Her expertise and calm demeanor were exactly what I needed.",
    name: 'David Kim',
    title: 'Individual Client',
    rating: 5,
  },
  {
    quote: "The client portal makes document sharing so easy. I can upload everything securely and track the progress of my return. Very modern and convenient.",
    name: 'Amanda Foster',
    title: 'Business Client',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="section-padding bg-primary">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-wider text-sm">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-primary-200 max-w-2xl mx-auto text-lg">
            Don't just take our word for it. Here's what our clients have to say
            about working with Gordon Ulen CPA.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 relative"
            >
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-accent/30 absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-primary-200 text-sm">{testimonial.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Rating */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-6 py-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-white font-medium">5.0 Average Rating</span>
            <span className="text-primary-200">from 100+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}
