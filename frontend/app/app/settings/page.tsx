import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Settings | advisorai.gr Admin',
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Ρυθμίσεις πλατφόρμας.
      </p>
      <ul className="mt-4 space-y-2">
        <li>
          <Link
            href="/app/settings/ai"
            className="text-primary hover:underline"
          >
            AI & Προτύπα (system prompts)
          </Link>
        </li>
        <li>
          <Link
            href="/app/settings/users"
            className="text-primary hover:underline"
          >
            Χρήστες & Ρόλοι
          </Link>
        </li>
      </ul>
    </div>
  );
}
