import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Usage | advisorai.gr Admin',
};

export default function AIUsagePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">AI Usage</h1>
      <p className="mt-2 text-muted-foreground">
        Στατιστικά χρήσης AI (tokens, κόστος, ανά μοντέλο). Σύντομα διαθέσιμο.
      </p>
    </div>
  );
}
