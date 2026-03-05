'use client';

import { useAuth } from '@/app/auth/auth-context';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border px-6',
      )}
    >
      <span className="text-sm text-muted-foreground">
        {user.email}
        <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {user.role}
        </span>
      </span>
      <button
        type="button"
        onClick={() => logout()}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Αποσύνδεση
      </button>
    </header>
  );
}
