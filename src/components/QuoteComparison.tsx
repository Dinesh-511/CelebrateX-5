import type { ReactElement } from 'react';
import { CATEGORIES, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { QuoteTable } from './QuoteTable';

export interface QuoteComparisonProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

/**
 * Organizes saved quotes by category and renders comparison tables or empty state.
 */
export function QuoteComparison({ plan, dispatch }: QuoteComparisonProps): ReactElement {
  const groups = CATEGORIES.map((c) => ({
    c,
    quotes: plan.quotes.filter((q) => q.category === c),
  })).filter((g) => g.quotes.length > 0);

  if (groups.length === 0) {
    return (
      <div className="card text-center py-8 shadow-soft">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent/20 mb-3">
          <Icon name="file" className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-ink">No quotations saved yet</p>
        <p className="hint text-xs max-w-md mx-auto mt-1">
          Analyze a quotation above and save it to compare up to three vendors side-by-side per
          category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <QuoteTable key={g.c} plan={plan} category={g.c} quotes={g.quotes} dispatch={dispatch} />
      ))}
    </div>
  );
}
