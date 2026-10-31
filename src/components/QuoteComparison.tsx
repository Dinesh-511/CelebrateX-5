import { categoryLabel, compareQuote, effectiveCost, formatINR } from '../engine';
import { CATEGORIES, type Category, type Plan, type StoredQuote } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { EstimateBadge } from './ui';

function CategoryTable({
  plan,
  category,
  quotes,
  dispatch,
}: {
  plan: Plan;
  category: Category;
  quotes: StoredQuote[];
  dispatch: (a: Action) => void;
}) {
  const label = categoryLabel(plan.occasion, category);
  const budget = plan.allocation[category];
  const cols = quotes.map((s) => {
    const cost = effectiveCost(s.quote, plan.guests);
    return { s, cost, flags: compareQuote(s.quote, plan) };
  });
  const cell = (render: (c: (typeof cols)[number]) => React.ReactNode) =>
    cols.map((c) => (
      <td key={c.s.id} className="border-b border-line px-3.5 py-3 text-xs sm:text-sm">
        {render(c)}
      </td>
    ));

  return (
    <section className="card overflow-x-auto shadow-soft" aria-labelledby={`cmp-${category}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 id={`cmp-${category}`} className="text-base font-bold text-ink">
            {label}: compare quotations
          </h3>
          <p className="hint text-xs mt-0.5">Budget for this category: <strong className="text-ink">{formatINR(budget)}</strong></p>
        </div>
        <EstimateBadge verified={quotes.some((q) => q.accepted)} />
      </div>

      <table className="mt-3 min-w-[30rem] border-separate border-spacing-0">
        <caption className="sr-only">Side-by-side quotations for {label}</caption>
        <thead>
          <tr className="bg-paper/70">
            <th scope="col" className="border-b border-line px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft rounded-tl-xl">
              <span className="sr-only">Detail</span>
            </th>
            {cols.map((c, i) => (
              <th
                key={c.s.id}
                scope="col"
                className={`border-b border-line px-3.5 py-2.5 text-xs sm:text-sm font-bold text-ink ${
                  i === cols.length - 1 ? 'rounded-tr-xl' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{c.s.quote.vendorName ?? `Quotation ${i + 1}`}</span>
                  {c.s.accepted && (
                    <span className="badge-verified text-[10px] font-bold">
                      <Icon name="check" className="h-3 w-3" /> Accepted
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Effective cost for {plan.guests} guests
            </th>
            {cell((c) =>
              c.cost === null ? (
                <span className="text-ink-soft">Not stated</span>
              ) : (
                <strong className="text-ink font-bold tabular">{formatINR(c.cost)}</strong>
              ),
            )}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Against budget
            </th>
            {cell((c) =>
              c.cost === null ? (
                <span className="text-ink-soft">-</span>
              ) : c.cost > budget ? (
                <span className="inline-flex items-center gap-1 font-semibold text-warn">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {formatINR(c.cost - budget)} over
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  {formatINR(budget - c.cost)} under
                </span>
              ),
            )}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Per plate
            </th>
            {cell((c) =>
              c.s.quote.pricePerPlate === null ? '-' : <span className="tabular">{formatINR(c.s.quote.pricePerPlate)}</span>,
            )}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Guest minimum
            </th>
            {cell((c) => c.s.quote.guestMinimum ?? '-')}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Advance
            </th>
            {cell((c) =>
              c.s.quote.advancePercent === null ? '-' : `${c.s.quote.advancePercent}%`,
            )}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Tax
            </th>
            {cell((c) =>
              c.s.quote.taxIncluded === null
                ? 'Not stated'
                : c.s.quote.taxIncluded
                  ? 'Included'
                  : 'Extra',
            )}
          </tr>
          <tr className="hover:bg-paper/30 transition-colors">
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Things to check
            </th>
            {cell((c) =>
              c.flags.length === 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  None
                </span>
              ) : (
                <ul className="space-y-1">
                  {c.flags.map((f) => (
                    <li key={f.code} className="text-warn text-xs font-medium">
                      <Icon name="alert" className="mr-1 inline h-3.5 w-3.5" />
                      {f.message}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </tr>
          <tr>
            <th scope="row" className="border-b border-line px-3.5 py-3 text-xs font-semibold text-ink-soft bg-paper/30">
              Actions
            </th>
            {cell((c) => (
              <div className="flex flex-wrap gap-2">
                {!c.s.accepted && (
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    disabled={c.cost === null}
                    onClick={() => dispatch({ type: 'acceptQuote', id: c.s.id })}
                  >
                    Accept
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => dispatch({ type: 'removeQuote', id: c.s.id })}
                >
                  Remove
                </button>
              </div>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function QuoteComparison({ plan, dispatch }: { plan: Plan; dispatch: (a: Action) => void }) {
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
          Analyze a quotation above and save it to compare up to three vendors side-by-side per category.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <CategoryTable key={g.c} plan={plan} category={g.c} quotes={g.quotes} dispatch={dispatch} />
      ))}
    </div>
  );
}
