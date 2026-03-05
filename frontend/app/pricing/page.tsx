import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — advisorai.gr',
  description: 'Starter, Pro & Enterprise plans. Start with a conversation.',
};

/** Section 1 & 7: Starter / Pro / Enterprise tiers, features, and prices. */
const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 299,
    currency: 'project',
    description: 'Ideal for small projects and first-time automation.',
    features: [
      'AI sales assistant chat',
      '1 solution proposal with pricing',
      'Lead capture & storage',
      'Build prompt generation',
      'Email notifications to your team',
    ],
  },
  {
    name: 'Pro',
    price: 799,
    currency: 'project',
    description: 'For growing teams that need full workflow control.',
    features: [
      'Everything in Starter',
      'Multiple conversations & proposals',
      '3 package options (Starter / Pro / Enterprise)',
      'Builder endpoint integration',
      'Priority build prompt delivery',
      'AI usage tracking',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 1999,
    currency: 'project',
    description: 'Full platform with custom builder and dedicated support.',
    features: [
      'Everything in Pro',
      'Custom builder integration',
      'Dedicated support & SLA',
      'Custom branding & workflows',
      'Audit logs & compliance',
      'Admin dashboard access',
    ],
  },
] as const;

function PricingCard({
  name,
  price,
  currency,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: number;
  currency: string;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`
        flex flex-col rounded-2xl border bg-[var(--card)] p-6 shadow-lg
        ${highlighted ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-[var(--card-border)]'}
      `}
    >
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      <p className="mt-4 text-3xl font-bold text-white">
        €{price.toLocaleString()}
        <span className="text-sm font-normal text-[var(--muted)]">/{currency}</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
            <span className="text-[var(--accent)] shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/start"
        className="mt-6 block w-full rounded-xl bg-[var(--accent)] py-3 text-center text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}

function PricingFooter() {
  return (
    <footer className="mt-16 w-full border-t border-[var(--card-border)] py-8">
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        <Link
          href="/admin/login"
          className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          Admin Access
        </Link>
        <Link
          href="/app/dashboard"
          className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          User Dashboard
        </Link>
        <Link
          href="/"
          className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          Main Site
        </Link>
      </div>
    </footer>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-10">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white md:text-4xl">Pricing</h1>
          <p className="mt-2 text-[var(--muted)]">
            Choose the plan that fits your business. Start with a conversation.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              currency={tier.currency}
              description={tier.description}
              features={tier.features}
              highlighted={tier.highlighted}
            />
          ))}
        </div>

        <PricingFooter />
      </div>
    </div>
  );
}
