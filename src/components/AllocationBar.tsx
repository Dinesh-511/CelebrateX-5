import { categoryLabel, percentOf } from '../engine';
import { CATEGORIES, type Category, type Plan } from '../schemas';

export const SWATCH_CLASS: Record<Category, string> = {
  venue: 'sw-venue',
  catering: 'sw-catering',
  decor: 'sw-decor',
  photography: 'sw-photography',
  entertainment: 'sw-entertainment',
  misc: 'sw-misc',
  contingency: 'sw-contingency',
};

export function AllocationBar({ plan }: { plan: Plan }) {
  const pctOf = (c: (typeof CATEGORIES)[number]) => percentOf(plan.allocation[c], plan.totalBudget);
  const parts = CATEGORIES.map((c, i) => ({
    category: c,
    label: categoryLabel(plan.occasion, c),
    pct: pctOf(c),
    x: CATEGORIES.slice(0, i).reduce((sum, before) => sum + pctOf(before), 0),
  }));
  const summary = parts.map((p) => `${p.label} ${p.pct}%`).join(', ');

  return (
    <div className="space-y-3">
      <div className="h-3.5 w-full overflow-hidden rounded-full bg-paper border border-line/80 shadow-2xs">
        <svg
          role="img"
          aria-label={`Budget split: ${summary}`}
          viewBox="0 0 100 1"
          preserveAspectRatio="none"
          className="block h-full w-full"
        >
          {parts.map((p) => (
            <rect
              key={p.category}
              x={p.x}
              y={0}
              width={p.pct}
              height={1}
              className={`${SWATCH_CLASS[p.category]} transition-all duration-300`}
            />
          ))}
        </svg>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-7 pt-1">
        {parts.map((p) => (
          <li
            key={p.category}
            className="flex items-center gap-2 rounded-lg border border-line/60 bg-paper/60 px-2.5 py-1.5 shadow-2xs"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-2xs ${SWATCH_CLASS[p.category]}`}
            />
            <span className="truncate text-ink font-medium">{p.label}</span>
            <span className="tabular ml-auto font-semibold text-ink-soft">{p.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
