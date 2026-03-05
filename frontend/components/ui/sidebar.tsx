'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/app/leads', icon: Users },
  { title: 'AI Usage', href: '/app/ai-usage', icon: BarChart3 },
  { title: 'Settings', href: '/app/settings', icon: Settings },
];

export function Sidebar({ items = defaultNavItems }: { items?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full w-56 flex-col border-r border-sidebar-border',
        'bg-sidebar text-sidebar-foreground',
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-6">
        <Link href="/app/dashboard" className="font-semibold text-lg tracking-tight">
          advisorai.gr
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/app/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-border/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
