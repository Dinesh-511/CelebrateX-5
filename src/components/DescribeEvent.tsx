import { useState, type KeyboardEvent } from 'react';
import type { IntakeParse } from '../schemas';
import { parseIntake, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';
import { Icon } from './Icon';

export const EXAMPLE_EVENT =
  'Shaadi in Pune, 200 guests, 8 lakh budget, mid-Feb, simple ceremony but premium food';

export function DescribeEvent({ onParsed }: { onParsed: (result: IntakeParse) => string[] }) {
  const [description, setDescription] = useState('');
  const [filled, setFilled] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string) => parseIntake(text, options));

  function acceptExample(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab' || event.shiftKey || description !== '') return;
    event.preventDefault();
    setDescription(EXAMPLE_EVENT);
  }

  async function fill() {
    setFilled(null);
    const result = await ai.run(description);
    if (!result) return;
    const found = onParsed(result);
    setFilled(
      found.length
        ? `Filled ${found.join(', ')}. Please check the details before creating your plan.`
        : 'We could not find event details in that text. You can fill the form below by hand.',
    );
  }

  return (
    <section className="card lg:sticky lg:top-20 shadow-soft" aria-labelledby="describe-h">
      <div className="border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <h2 id="describe-h" className="text-lg sm:text-xl font-bold text-ink">
            Describe your event
          </h2>
          <span className="badge-estimate text-[10px] font-bold text-accent bg-accent-soft border-accent/20">
            Natural Intake
          </span>
        </div>
        <p className="hint text-xs mt-0.5">
          Write it the way you would tell a friend. We will fill the form for you.
        </p>
      </div>

      <label htmlFor="describe" className="sr-only">
        Event description
      </label>
      <textarea
        id="describe"
        className="input mt-4 min-h-28 text-xs sm:text-sm leading-relaxed"
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={EXAMPLE_EVENT}
        aria-describedby={description === '' ? 'describe-tab-hint' : undefined}
        onKeyDown={acceptExample}
      />
      {description === '' && (
        <p id="describe-tab-hint" className="hint text-xs flex items-center gap-1.5 mt-2">
          <span>Press</span>
          <kbd className="rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] font-mono font-bold shadow-2xs">
            Tab
          </kbd>
          <span>to use this example.</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
          onClick={() => void fill()}
          disabled={description.trim() === '' || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          Fill form from description
        </button>
        <span className="text-[11px] text-ink-soft">{description.length}/1000 · AI suggestion</span>
      </div>

      <div className="mt-3" aria-live="polite">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading your description…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void fill()} />
        )}
        {filled && ai.state.status === 'done' && (
          <div className="rounded-xl border border-accent/25 bg-accent-soft p-3.5 shadow-2xs">
            <p className="text-xs sm:text-sm font-semibold text-accent">{filled}</p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
    </section>
  );
}
