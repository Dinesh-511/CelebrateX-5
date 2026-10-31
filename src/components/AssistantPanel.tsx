import { useMemo, useState } from 'react';
import {
  diffDays,
  planInsights,
  type Insight,
  type InsightSeverity,
  type InsightTab,
} from '../engine';
import type { Plan } from '../schemas';
import { reviewPlan, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { AskPlanner } from './AskPlanner';
import { Icon, type IconName } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const SEVERITY: Record<
  InsightSeverity,
  { label: string; icon: IconName; badgeClass: string; iconColor: string }
> = {
  critical: {
    label: 'Urgent',
    icon: 'alert',
    badgeClass: 'badge-warn',
    iconColor: 'text-warn',
  },
  warning: {
    label: 'Needs attention',
    icon: 'clock',
    badgeClass: 'badge border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  suggestion: {
    label: 'Suggestion',
    icon: 'sparkle',
    badgeClass: 'badge border-accent/25 bg-accent-soft text-accent',
    iconColor: 'text-accent',
  },
};

const TAB_LABEL: Record<InsightTab, string> = {
  budget: 'Budget',
  timeline: 'Timeline',
  vendors: 'Vendors',
};

const COLLAPSED = 3;

function InsightRow({
  insight,
  onNavigate,
}: {
  insight: Insight;
  onNavigate: (tab: InsightTab) => void;
}) {
  const s = SEVERITY[insight.severity];
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3.5 transition-colors hover:bg-paper/40 rounded-xl px-2 sm:px-3">
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-card shadow-2xs">
          <Icon name={s.icon} className={`h-4 w-4 ${s.iconColor}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={s.badgeClass}>{s.label}</span>
            <p className="font-semibold text-sm text-ink">{insight.title}</p>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">{insight.detail}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn-secondary text-xs shrink-0 self-center"
        onClick={() => onNavigate(insight.tab)}
      >
        Open {TAB_LABEL[insight.tab]}
      </button>
    </li>
  );
}

/**
 * Modern AI Planning Assistant Copilot: deterministic engine ranking with Gemini language reasoning.
 */
export function AssistantPanel({
  plan,
  today,
  onNavigate,
}: {
  plan: Plan;
  today: string;
  onNavigate: (tab: InsightTab) => void;
}) {
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const [expanded, setExpanded] = useState(false);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof reviewPlan>[0]) =>
    reviewPlan(request, options),
  );
  const shown = expanded ? insights : insights.slice(0, COLLAPSED);
  const urgent = insights.filter((i) => i.severity !== 'suggestion').length;

  const askAi = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      daysToEvent: diffDays(today, plan.eventDate),
      vibe: plan.vibe,
      insights: insights
        .slice(0, 10)
        .map(({ severity, title, detail }) => ({ severity, title, detail })),
    });

  return (
    <section className="card mb-6 shadow-soft" aria-labelledby="assistant-h">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="assistant-h" className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent border border-accent/20">
                <Icon name="sparkle" className="h-4 w-4" />
              </span>
              Your planning assistant
            </h2>
            <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Deterministic Engine Active
            </span>
          </div>
          <p className="hint text-xs sm:text-sm mt-1" aria-live="polite">
            {urgent > 0
              ? `${urgent} ${urgent === 1 ? 'thing needs' : 'things need'} your attention.`
              : 'Nothing urgent. Here is what to do next.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs sm:text-sm"
          onClick={() => void askAi()}
          disabled={insights.length === 0 || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4 text-accent" />
          {ai.state.status === 'done' ? 'Refresh AI review' : 'Ask AI for a plan review'}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="my-4 flex items-center gap-2.5 rounded-xl border border-ok/20 bg-ok-soft p-3 text-sm font-medium text-ok">
          <Icon name="check" className="h-4 w-4" />
          Everything is on track.
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line/60" aria-label="What needs attention">
          {shown.map((insight) => (
            <InsightRow key={insight.id} insight={insight} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
      {insights.length > COLLAPSED && (
        <button
          type="button"
          className="btn-quiet mt-2 text-xs font-semibold"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show all ${insights.length}`}
        </button>
      )}

      <div aria-live="polite" className="mt-3">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reviewing your plan…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void askAi()} />
        )}
        {ai.state.status === 'done' && (
          <div className="rounded-2xl border border-accent/20 bg-accent-soft p-5 shadow-soft" data-testid="ai-review">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="sparkle" className="h-4 w-4 text-accent" />
              <p className="text-xs font-bold uppercase tracking-wider text-accent">AI Plan Synthesis</p>
            </div>
            <p className="text-sm font-medium text-ink">{ai.state.data.summary}</p>
            <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm text-ink-soft">
              {ai.state.data.steps.map((step) => (
                <li key={step.title}>
                  <strong className="text-ink">{step.title}.</strong> {step.why}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-ink-soft/80 border-t border-accent/15 pt-2">
              AI review of the facts above. It never adds prices, dates or vendors.
            </p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
      <AskPlanner plan={plan} today={today} />
    </section>
  );
}
