import type { ReactElement } from 'react';
import type { BudgetStatus } from '../engine';
import { formatINR } from '../engine';
import { Icon } from './Icon';

export interface BudgetStatusBannerProps {
  status: BudgetStatus;
  onShowOptions: () => void;
}

/**
 * Sticky banner showing whether the current plan is within budget or over budget,
 * providing a 1-click jump to trade-off options when over budget.
 */
export function BudgetStatusBanner({
  status,
  onShowOptions,
}: BudgetStatusBannerProps): ReactElement {
  const over = status.overBy > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="over-budget-region"
      className="sticky top-16 z-20"
    >
      {over ? (
        <div className="flex h-[4.5rem] items-center gap-3.5 rounded-2xl border border-warn/50 bg-warn-soft px-5 text-warn shadow-card backdrop-blur-md">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warn text-paper shadow-2xs">
            <Icon name="alert" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm sm:text-base font-bold">
              Over budget by {formatINR(status.overBy)}
            </p>
            <p className="truncate text-xs sm:text-sm text-warn/90">
              {status.overByPct}% of your total. Nothing was changed automatically.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary shrink-0 text-xs sm:text-sm"
            onClick={onShowOptions}
          >
            Options
          </button>
        </div>
      ) : (
        <div className="flex h-[4.5rem] items-center gap-3.5 rounded-2xl border border-line bg-card/95 px-5 text-ink-soft shadow-card backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok border border-ok/20">
            <Icon name="check" className="h-4 w-4" />
          </div>
          <p className="truncate text-sm font-semibold text-ink">
            Within budget. Everything adds up to {formatINR(status.total)}.
          </p>
        </div>
      )}
    </div>
  );
}
