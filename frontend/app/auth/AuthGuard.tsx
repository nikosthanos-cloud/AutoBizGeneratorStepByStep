'use client';

import { useAuth } from './auth-context';
import Link from 'next/link';

/**
 * Higher Order Component that wraps admin pages.
 * Allows access only if user has ADMIN or OPERATOR role.
 * Replace the mock check with real JWT/OIDC when backend auth is wired.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, hasAdminOrOperatorRole, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Φόρτωση...</div>
      </div>
    );
  }

  if (!user || !hasAdminOrOperatorRole()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Δεν έχετε πρόσβαση</h1>
        <p className="text-center text-muted-foreground max-w-sm">
          Απαιτείται ρόλος Administrator ή Operator για την πρόσβαση στο Admin Dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Σύνδεση
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Αρχική
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
