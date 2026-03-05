'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/app/leads"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στα Leads
      </Link>
      <h1 className="text-2xl font-semibold">Lead {id}</h1>
      <p className="text-muted-foreground">
        Λεπτομέρειες lead (πελάτης, συνομιλία, proposal, build prompts). Σύντομα διαθέσιμο.
      </p>
    </div>
  );
}
