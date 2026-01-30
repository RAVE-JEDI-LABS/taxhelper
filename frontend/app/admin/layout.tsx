'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  FileText,
  Users,
  FolderOpen,
  Calendar,
  LayoutDashboard,
  LogOut,
  ClipboardList,
  Kanban,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/returns', label: 'Tax Returns', icon: FileText },
  { href: '/admin/documents', label: 'Documents', icon: FolderOpen },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/workflows', label: 'Workflows', icon: ClipboardList },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary-400" />
            <span className="font-bold">Tax Helper</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2 truncate">
            {user.email}
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-gray-300 hover:text-white text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
