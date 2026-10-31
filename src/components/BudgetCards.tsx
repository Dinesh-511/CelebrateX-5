import { formatINR, toLakh, type budgetStatus } from '../engine';

export function BudgetCards({ status }: { status: ReturnType<typeof budgetStatus> }) {
  const cards = [
    {
      label: 'Total budget',
      val: formatINR(status.total),
      sub: toLakh(status.total),
      color: 'text-ink',
    },
    {
      label: 'Committed (verified quotations)',
      val: formatINR(status.committed),
      sub: 'Locked vendor prices',
      color: 'text-ok',
    },
    {
      label: 'Estimated (not yet quoted)',
      val: formatINR(status.estimated),
      sub: 'Flexible model targets',
      color: 'text-ink',
    },
  ];

  return (
    <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-paper/60 p-4 shadow-2xs">
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {item.label}
          </dt>
          <dd
            className={`tabular mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${item.color}`}
          >
            {item.val}
          </dd>
          <dd className="text-xs font-medium text-ink-soft mt-0.5">{item.sub}</dd>
        </div>
      ))}
    </dl>
  );
}
