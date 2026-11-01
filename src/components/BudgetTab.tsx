import { useCallback, useMemo, useRef, type ReactElement } from 'react';
import { useSyncedText } from '../lib/useSyncedText';
import {
  budgetStatus,
  categoryNeeds,
  formatINR,
  generateOverBudgetOptions,
  OCCASION_LABELS,
  parseGuests,
  parseINR,
  scaleGuests,
} from '../engine';
import { MAX_GUESTS, type Category, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { AllocationBar, SWATCH_CLASS } from './AllocationBar';
import { BudgetCards } from './BudgetCards';
import { BudgetStatusBanner } from './BudgetStatusBanner';
import { CategoryRow } from './CategoryRow';
import { Icon } from './Icon';
import { TradeoffPanel } from './TradeoffPanel';
import { Field } from './ui';

export interface BudgetTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

/**
 * Budget tab view: connected distribution sliders, card summary, guest impact, and tradeoff options.
 */
export function BudgetTab({ plan, dispatch }: BudgetTabProps): ReactElement {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const needs = useMemo(() => categoryNeeds(plan), [plan]);
  const options = useMemo(() => generateOverBudgetOptions(plan), [plan]);
  const impact = useMemo(() => scaleGuests(plan, plan.guests), [plan]);

  const [guestsText, setGuestsText] = useSyncedText(String(plan.guests));
  const [budgetText, setBudgetText] = useSyncedText(String(plan.totalBudget));
  const [perPlateText, setPerPlateText] = useSyncedText(String(Math.round(plan.perPlate)));

  const onChange = useCallback(
    (category: Category, amount: number) => dispatch({ type: 'setAmount', category, amount }),
    [dispatch],
  );
  const onToggleLock = useCallback(
    (category: Category) => dispatch({ type: 'toggleLock', category }),
    [dispatch],
  );

  function commitGuests(value: string): void {
    const guests = parseGuests(value);
    if (guests === null) setGuestsText(String(plan.guests));
    else dispatch({ type: 'setGuests', guests });
  }

  function commitBudget(): void {
    const parsed = parseINR(budgetText);
    if (parsed === null) setBudgetText(String(plan.totalBudget));
    else dispatch({ type: 'setTotal', total: parsed });
  }

  function commitPerPlate(): void {
    const parsed = perPlateText.trim() === '0' ? 0 : parseINR(perPlateText);
    if (parsed === null) setPerPlateText(String(Math.round(plan.perPlate)));
    else dispatch({ type: 'setPerPlate', perPlate: parsed });
  }

  const over = status.overBy > 0;
  const optionsRef = useRef<HTMLDivElement>(null);
  const showOptions = (): void => {
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    optionsRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-6">
      <section className="card shadow-soft" aria-labelledby="summary-h">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 id="summary-h" className="text-xl font-bold">
              Budget at a glance
            </h2>
            <p className="hint text-xs mt-0.5">Connected allocation with zero rounding drift</p>
          </div>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent border border-accent/20">
            {OCCASION_LABELS[plan.occasion]} Preset
          </span>
        </div>
        <BudgetCards status={status} />
        <div className="mt-6 pt-5 border-t border-line">
          <AllocationBar plan={plan} />
        </div>
      </section>

      <BudgetStatusBanner status={status} onShowOptions={showOptions} />

      <section aria-labelledby="cats-h">
        <div className="mb-4">
          <h2 id="cats-h" className="text-xl font-bold">
            Where the money goes
          </h2>
          <p className="hint text-xs sm:text-sm mt-1">
            Move one slider and the others adjust to keep the total the same. Lock a category to
            protect it.
          </p>
        </div>
        <div className="card divide-y divide-line !p-0 shadow-soft overflow-hidden">
          {needs.map((need) => (
            <CategoryRow
              key={need.category}
              occasion={plan.occasion}
              category={need.category}
              amount={plan.allocation[need.category]}
              total={plan.totalBudget}
              locked={plan.locked.includes(need.category)}
              need={need}
              swatchClass={SWATCH_CLASS[need.category]}
              onChange={onChange}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Splits start from typical presets for a {OCCASION_LABELS[plan.occasion].toLowerCase()} and
          stay estimates until you accept a vendor quotation.
        </p>
      </section>

      <section className="card shadow-soft" aria-labelledby="controls-h">
        <h2 id="controls-h" className="text-xl font-bold">
          Guests and totals
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <Field label="Number of guests">
            {(p) => (
              <input
                {...p}
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_GUESTS}
                value={guestsText}
                onChange={(e) => {
                  setGuestsText(e.target.value);
                  const guests = parseGuests(e.target.value);
                  if (guests !== null) dispatch({ type: 'setGuests', guests });
                }}
                onBlur={(e) => commitGuests(e.target.value)}
              />
            )}
          </Field>
          <Field label="Total budget (₹)" hint="Try 8 lakh or 8,00,000">
            {(p) => (
              <input
                {...p}
                className="input"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={(e) => e.key === 'Enter' && commitBudget()}
              />
            )}
          </Field>
          <Field
            label="Catering cost per plate (₹)"
            hint="Starts from your catering share. Edit if you know better."
          >
            {(p) => (
              <input
                {...p}
                className="input"
                value={perPlateText}
                onChange={(e) => setPerPlateText(e.target.value)}
                onBlur={commitPerPlate}
                onKeyDown={(e) => e.key === 'Enter' && commitPerPlate()}
              />
            )}
          </Field>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3.5">
          <p className="tabular text-xs sm:text-sm text-ink-soft" data-testid="guest-impact">
            <span className="font-semibold text-ink">{plan.guests} guests</span> ×{' '}
            {formatINR(Math.round(impact.perPlate))} per plate needs{' '}
            <strong className="text-ink">{formatINR(impact.requiredCatering)}</strong> for catering.
            You have budgeted{' '}
            <strong className="text-ink">{formatINR(impact.currentCatering)}</strong>
            {impact.overBy > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-warn ml-1">
                <Icon name="alert" className="h-3.5 w-3.5" />:{formatINR(impact.overBy)} short.
              </span>
            ) : (
              '. That covers it.'
            )}
          </p>
        </div>
      </section>

      {over && (
        <div id="tradeoffs" ref={optionsRef} tabIndex={-1} className="outline-none">
          <TradeoffPanel
            plan={plan}
            options={options}
            overBy={status.overBy}
            onApply={(option) => dispatch({ type: 'applyOption', option })}
          />
        </div>
      )}
    </div>
  );
}
