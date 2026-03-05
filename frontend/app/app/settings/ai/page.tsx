'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth/auth-context';
import {
  getAdminAiUsage,
  getAdminPrompts,
  updateAdminPrompts,
  type AdminPrompts,
} from '@/lib/api';

export default function SettingsAIPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminUser =
    user && user.role === 'ADMIN'
      ? { id: user.id, email: user.email, role: user.role }
      : null;

  const [salesAssistant, setSalesAssistant] = useState('');
  const [proposalGenerator, setProposalGenerator] = useState('');

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: () => getAdminPrompts(adminUser!),
    enabled: !!adminUser,
  });

  useEffect(() => {
    if (prompts) {
      setSalesAssistant(prompts.sales_assistant);
      setProposalGenerator(prompts.proposal_generator);
    }
  }, [prompts]);

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: () => getAdminAiUsage(adminUser!, 50),
    enabled: !!adminUser,
  });

  const updateMutation = useMutation({
    mutationFn: (body: AdminPrompts) => updateAdminPrompts(adminUser!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      sales_assistant: salesAssistant,
      proposal_generator: proposalGenerator,
    });
  };

  if (!adminUser) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Απαιτείται ρόλος Admin για πρόσβαση στις ρυθμίσεις AI.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">AI & Προτύπα</h1>

      {/* Latest AI Usage Logs */}
      <section>
        <h2 className="text-lg font-medium mb-3">Τελευταία AI Usage Logs</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {usageLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Φόρτωση...
            </div>
          ) : usage?.data?.length ? (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Model</th>
                    <th className="text-right px-4 py-2 font-medium">Tokens</th>
                    <th className="text-right px-4 py-2 font-medium">Cost</th>
                    <th className="text-left px-4 py-2 font-medium">Ημ/νία</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.data.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-2">{log.type}</td>
                      <td className="px-4 py-2">{log.model}</td>
                      <td className="px-4 py-2 text-right">
                        {log.totalTokens ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {log.costEstimate != null
                          ? `$${log.costEstimate.toFixed(4)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('el-GR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Δεν υπάρχουν logs.
            </div>
          )}
        </div>
        {usage && (
          <p className="mt-2 text-sm text-muted-foreground">
            Σύνολο {usage.total} εγγραφών (εμφανίζονται τα τελευταία 50).
          </p>
        )}
      </section>

      {/* System Prompts Form */}
      <section>
        <h2 className="text-lg font-medium mb-3">System Prompts</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Οι αλλαγές αποθηκεύονται στη βάση και εφαρμόζονται αμέσως χωρίς redeploy.
        </p>
        {promptsLoading ? (
          <div className="text-muted-foreground text-sm">Φόρτωση prompts...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sales Assistant (συνομιλία με επισκέπτη)
              </label>
              <textarea
                value={salesAssistant}
                onChange={(e) => setSalesAssistant(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="System prompt για τον Sales Assistant..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Proposal Generator (JSON με Starter / Pro / Enterprise)
              </label>
              <textarea
                value={proposalGenerator}
                onChange={(e) => setProposalGenerator(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="System prompt για τη δημιουργία proposal..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
              {updateMutation.isSuccess && (
                <span className="text-sm text-green-600">Αποθηκεύτηκε.</span>
              )}
              {updateMutation.isError && (
                <span className="text-sm text-destructive">
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : 'Σφάλμα'}
                </span>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
