'use client';

import { AuthProvider } from '@/app/auth/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
