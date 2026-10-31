import { useState } from 'react';
import { formatINR, type TradeoffOption } from '../engine';
import type { Plan } from '../schemas';
import { explainTradeoffs, type RequestOptions } from '../lib/api';
import { describeChanges } from '../lib/format';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading, Confirm } from './ui';

export function TradeoffPanel({
  plan,
  options,
  overBy,
  onApply,
}: {
  plan: Plan;
  options: TradeoffOption[];
  overBy: number;
  onApply: (option: TradeoffOption) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof explainTradeoffs>[0]) =>
    explainTradeoffs(request, options),
  );

  const explain = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      overBy,
      priorities: plan.priorities,
      options: options.map((o) => ({
        id: o.id,
        title: o.title,
        coversRupees: o.coversRupees,
        summary: o.description,
        warning: o.warning,
      })),
    });

  if (options.length === 0) {
    return (
      <section className="card shadow-soft" aria-labelledby="options-h">
        <h2 id="options-h" className="text-xl font-bold">Ways to close the gap</h2>
        <p className="mt-2 text-sm text-ink-soft">
          No automatic option fits {formatINR(overBy)}. Try fewer guests, a bigger total budget, or unlock categories so money can move.
        </p>
      </section>
    );
  }

  const explanations = ai.state.status === 'done' ? ai.state.data.explanations : [];
  return (
    <section className="card shadow-soft" aria-labelledby="options-h">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 id="options-h" className="text-xl font-bold">Ways to close the gap</h2>
          <p className="hint text-xs mt-0.5">Nothing changes until you apply an option.</p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs sm:text-sm"
          onClick={() => void explain()}
          disabled={ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4 text-accent" />
          Explain these options
        </button>
      </div>

      <div aria-live="polite" className="mt-3">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is explaining the options…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void explain()} />
        )}
        {ai.state.status === 'done' && <AnswerMeta progress={ai.progress} />}
      </div>

      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {options.map((o) => {
          const explanation = explanations.find((e) => e.optionId === o.id);
          return (
            <li
              key={o.id}
              className="flex flex-col rounded-2xl border border-line bg-paper/50 p-5 shadow-2xs transition-all duration-200 hover:border-accent/40 hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-ink">{o.title}</h3>
                <span className="badge-verified text-[11px] shrink-0 font-bold">
                  Saves {formatINR(o.coversRupees)}
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">{o.description}</p>
              {o.changes.length > 0 && (
                <div className="mt-3 rounded-lg border border-line bg-card/70 p-2.5 text-xs font-medium text-ink">
                  {describeChanges(plan.occasion, o.changes)}
                </div>
              )}
              {o.warning && (
                <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-warn">
                  <Icon name="alert" className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{o.warning}</span>
                </p>
              )}
              {explanation && (
                <div className="mt-3 rounded-xl border border-accent/20 bg-accent-soft p-3 text-xs leading-relaxed">
                  <p className="font-medium text-ink">{explanation.summary}</p>
                  <p className="mt-1.5 font-semibold text-accent">Best when: {explanation.bestWhen}</p>
                  <p className="mt-1 text-[10px] text-ink-soft">AI explanation of the figures above</p>
                </div>
              )}
              <div className="mt-auto pt-5">
                {confirming === o.id ? (
                  <Confirm
                    prompt={`Apply "${o.title}"? You can still adjust everything afterwards.`}
                    confirmLabel="Yes, apply"
                    onCancel={() => setConfirming(null)}
                    onConfirm={() => {
                      onApply(o);
                      setConfirming(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="btn-primary w-full text-xs font-bold"
                    onClick={() => setConfirming(o.id)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
