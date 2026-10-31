import { diffDays, OCCASION_LABELS, toLakh } from '../engine';
import type { Plan } from '../schemas';
import { formatDate } from '../lib/format';
import { Icon } from './Icon';

function countdown(days: number): string {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'This date has passed';
}

/** The event at a glance, styled as a modern executive summary hero banner. */
export function PlanMasthead({ plan, today }: { plan: Plan; today: string }) {
  const days = diffDays(today, plan.eventDate);
  return (
    <section
      aria-label="Plan summary"
      className="card mb-6 border-line bg-gradient-to-br from-card via-card to-accent-soft/30 p-5 sm:p-7 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="badge-estimate text-[11px] font-semibold uppercase tracking-wider text-accent border-accent/20 bg-accent-soft">
              Active Celebration Plan
            </span>
            <span className="badge-estimate text-[11px] font-medium text-ink-soft">
              Connected Plan
            </span>
          </div>
          <h2
            id="plan-title"
            tabIndex={-1}
            className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl text-ink outline-none"
          >
            {OCCASION_LABELS[plan.occasion]}
            <span className="block text-ink-soft font-normal sm:inline">
              <span className="hidden sm:inline"> · </span>
              {formatDate(plan.eventDate)}
            </span>
          </h2>
          {plan.vibe && (
            <p className="mt-1.5 text-sm sm:text-base italic text-ink-soft/90 max-w-2xl">
              &ldquo;{plan.vibe}&rdquo;
            </p>
          )}
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-ink-soft">
        <li className="flex items-center gap-2 rounded-xl border border-line bg-card/80 px-3.5 py-1.5 shadow-2xs">
          <Icon name="users" className="h-4 w-4 text-accent" />
          <span className="text-ink font-semibold">{plan.guests}</span> guests
        </li>
        <li className="flex items-center gap-2 rounded-xl border border-line bg-card/80 px-3.5 py-1.5 shadow-2xs">
          <Icon name="wallet" className="h-4 w-4 text-accent" />
          <span className="text-ink font-semibold">{toLakh(plan.totalBudget)}</span> budget
        </li>
        <li className="flex items-center gap-2 rounded-xl border border-line bg-card/80 px-3.5 py-1.5 shadow-2xs">
          <Icon name="calendar" className="h-4 w-4 text-accent" />
          <span className="text-ink font-semibold">{countdown(days)}</span>
        </li>
      </ul>
    </section>
  );
}
