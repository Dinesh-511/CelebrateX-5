import { categoryLabel } from '../engine';
import { CATEGORIES, type Category, type Occasion } from '../schemas';
import { Field } from './ui';

const PRIORITY_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

export function PlanExtras({
  occasion,
  vibe,
  priorities,
  onVibe,
  onPriorities,
}: {
  occasion: Occasion;
  vibe: string;
  priorities: Category[];
  onVibe: (vibe: string) => void;
  onPriorities: (priorities: Category[]) => void;
}) {
  function toggle(category: Category) {
    onPriorities(
      priorities.includes(category)
        ? priorities.filter((c) => c !== category)
        : [...priorities, category],
    );
  }

  return (
    <details className="rounded-2xl border border-line bg-paper/40 p-4 transition-all duration-200">
      <summary className="min-h-11 cursor-pointer font-bold text-xs uppercase tracking-wider text-ink-soft hover:text-ink select-none outline-none">
        Make it yours (optional)
      </summary>
      <div className="mt-4 space-y-5 pt-3 border-t border-line/60">
        <Field label="Style or vibe" hint="For example: traditional, minimal, fun for kids.">
          {(p) => (
            <input
              {...p}
              className="input text-xs sm:text-sm"
              maxLength={200}
              value={vibe}
              onChange={(e) => onVibe(e.target.value)}
            />
          )}
        </Field>
        <fieldset>
          <legend className="label mb-2">
            What matters most? We give these categories more of the budget.
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {PRIORITY_CATEGORIES.map((c) => (
              <label
                key={c}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-line/50 bg-card/60 px-3 py-2 text-xs sm:text-sm font-medium text-ink hover:bg-paper hover:border-line cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded accent-accent cursor-pointer"
                  checked={priorities.includes(c)}
                  onChange={() => toggle(c)}
                />
                {categoryLabel(occasion, c)}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
