'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FileText, Users, Calendar, ClipboardList } from 'lucide-react';

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

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Built by RaveJedi Labs</p>
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
