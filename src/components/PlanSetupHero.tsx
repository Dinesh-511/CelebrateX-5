import type { ReactElement } from 'react';

/**
 * Welcome hero banner shown during initial plan creation.
 */
export function PlanSetupHero(): ReactElement {
  return (
    <div className="lg:col-span-2 card bg-gradient-to-br from-card via-card to-accent-soft/30 p-6 sm:p-8 shadow-soft">
      <span className="badge-estimate text-[11px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent-soft mb-3 inline-flex">
        Celebration Architecture
      </span>
      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
        Plan the celebration, not the spreadsheet.
      </h2>
      <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-ink-soft leading-relaxed">
        Tell us about your event. CelebrateX keeps your budget, timeline and vendors in one
        connected plan, so a change in one place updates everything else.
      </p>
    </div>
  );
}
