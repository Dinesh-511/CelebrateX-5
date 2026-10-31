import { RUN_SHEETS } from '../engine';
import type { Occasion } from '../schemas';

export function RunSheet({ occasion }: { occasion: Occasion }) {
  return (
    <section className="card shadow-soft" aria-labelledby="runsheet-h">
      <div className="border-b border-line pb-3">
        <h3 id="runsheet-h" className="font-bold text-lg text-ink tracking-tight">
          On the day: suggested run sheet
        </h3>
        <p className="hint text-xs mt-0.5">
          Typical timings to share with family and vendors. Adjust them to your muhurat and venue
          slot.
        </p>
      </div>
      <ol className="mt-4 space-y-2.5">
        {RUN_SHEETS[occasion].map((item) => (
          <li
            key={item.time}
            className="flex items-center gap-3.5 rounded-xl border border-line/60 bg-paper/50 px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs hover:bg-paper transition-colors"
          >
            <time className="tabular flex h-7 items-center justify-center rounded-lg bg-accent-soft px-2.5 font-bold text-accent border border-accent/20 text-xs">
              {item.time}
            </time>
            <span className="font-medium text-ink">{item.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
