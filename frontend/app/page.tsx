'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FileText, Users, Calendar, ClipboardList, Send, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gordon Ulen CPA
              </h1>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/kanban"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Kanban
                  </Link>
                  <Link
                    href="/workflows"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Workflows
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Staff Login
                  </Link>
                  <Link
                    href="/portal"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Client Portal
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tax Helper
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamlined tax preparation workflow automation for Gordon Ulen CPA firm.
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/portal"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
              >
                Client Portal
              </Link>
              <Link
                href="/login"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium border border-primary-600"
              >
                Staff Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Client Management"
              description="Track customers, documents, and tax return status"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Front Desk Assistant"
              description="Check-in clients, manage walk-ins, routing sheets, and drop-offs"
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Document Processing"
              description="AI-powered OCR - replaces GruntWorx at no per-page cost"
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Appointment Scheduling"
              description="Manage client appointments and automated reminders"
            />
            <FeatureCard
              icon={<ClipboardList className="h-8 w-8" />}
              title="Workflow Automation"
              description="29 standardized procedures for front desk and office"
            />
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600">Built by RaveJedi Labs</p>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/portal" className="text-gray-600 hover:text-primary-600">
                Client Portal
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-primary-600">
                Staff Login
              </Link>
              <Link href="/workflows" className="text-gray-600 hover:text-primary-600">
                Workflows
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function ContactForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = user ? await user.getIdToken() : undefined;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
          <p className="text-gray-600">We'll get back to you within 1 business day.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 text-primary-600 hover:underline"
          >
            Send another message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Contact Us</h3>
        <p className="text-gray-600 text-center mb-8">
          Have questions? Send us a message and we'll get back to you.
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(555) 555-5555"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="How can we help you?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Or call us at <a href="tel:+19783727050" className="text-primary-600 hover:underline">(978) 372-7050</a>
        </p>
      </div>
    </section>
  );
}
