'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function SubdomainRouter() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    // Handle subdomain routing
    if (subdomain === 'admin' && !pathname.startsWith('/admin') && !pathname.startsWith('/login')) {
      // admin.gordonulencpa.com → redirect to /admin or /login
      if (pathname === '/') {
        router.replace('/admin');
      }
    } else if (subdomain === 'portal' && !pathname.startsWith('/portal')) {
      // portal.gordonulencpa.com → redirect to /portal
      if (pathname === '/' || pathname === '/login') {
        router.replace('/portal');
      }
    }
    // gordonulencpa.com (no subdomain or www) → stay on landing page
  }, [pathname, router]);

  return null;
}
