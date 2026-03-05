'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useChat } from '@/hooks/use-chat';
import { createLead, type CreateLeadResponse, type ProposalPackage } from '@/lib/api';

function PricingCard({
  pkg,
  index,
  highlighted,
}: {
  pkg: ProposalPackage;
  index: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl border bg-[var(--card)] p-6 shadow-lg animate-slide-in-bottom
        ${highlighted ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-[var(--card-border)]'}
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
      <p className="mt-2 text-3xl font-bold text-white">
        €{pkg.price}
        <span className="text-sm font-normal text-[var(--muted)]">/{pkg.currency}</span>
      </p>
      <ul className="mt-4 space-y-2">
        {pkg.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
            <span className="text-[var(--accent)]">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StartPage() {
  const { messages, append, isLoading, error, getTranscript } = useChat();
  const [input, setInput] = useState('');
  const [proposal, setProposal] = useState<CreateLeadResponse['proposal'] | null>(null);
  const [showCards, setShowCards] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const createLeadMutation = useMutation({
    mutationFn: () =>
      createLead({
        messages: getTranscript(),
      }),
    onSuccess: (data) => {
      setProposal(data.proposal);
      setShowCards(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    append(text);
  };

  const handleGetProposal = () => {
    if (getTranscript().length === 0) return;
    createLeadMutation.mutate();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6">
      <div className="flex w-full max-w-2xl flex-1 flex-col">
        {/* Chat Window - centered card */}
        <div className="flex flex-1 flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <h1 className="text-lg font-semibold text-white">advisorai.gr — Sales Assistant</h1>
            <p className="text-xs text-[var(--muted)]">Share your needs; we’ll suggest the right plan.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[50vh]">
            {messages.length === 0 && (
              <p className="text-center text-[var(--muted)] text-sm py-8">
                Γεια σας! Πείτε μας τι χρειάζεται η επιχείρησή σας και θα σας προτείνουμε λύσεις.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
                    ${m.role === 'user'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--card-border)]'}
                  `}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--muted)]">
                  Σκέφτομαι…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="border-t border-[var(--card-border)] p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Γράψτε το μήνυμά σας..."
                className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:pointer-events-none"
              >
                Αποστολή
              </button>
            </form>
            <button
              type="button"
              onClick={handleGetProposal}
              disabled={isLoading || getTranscript().length === 0 || createLeadMutation.isPending}
              className="mt-3 w-full rounded-xl border border-[var(--accent)] bg-transparent py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              {createLeadMutation.isPending ? 'Δημιουργία proposal…' : 'Get Proposal'}
            </button>
            {createLeadMutation.isError && (
              <p className="mt-2 text-center text-sm text-red-400">
                {createLeadMutation.error instanceof Error
                  ? createLeadMutation.error.message
                  : 'Failed to create proposal'}
              </p>
            )}
          </div>
        </div>

        {/* Slide-in Pricing Cards from proposal */}
        {showCards && proposal && (
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <PricingCard pkg={proposal.starter} index={0} />
            <PricingCard pkg={proposal.pro} index={1} highlighted />
            <PricingCard pkg={proposal.enterprise} index={2} />
          </div>
        )}
      </div>
    </div>
  );
}
