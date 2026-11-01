import type { KeyboardEvent, MutableRefObject, ReactElement } from 'react';
import { planReadiness } from '../engine';
import type { Plan } from '../schemas';
import { BrandMark, Icon, type IconName } from './Icon';
import { BRAND } from '../config/brand';
import { SidebarActions } from './SidebarActions';

export const TABS = [
  { id: 'setup', label: 'Plan setup', icon: 'pencil' },
  { id: 'budget', label: 'Budget', icon: 'wallet' },
  { id: 'timeline', label: 'Timeline', icon: 'route' },
  { id: 'vendors', label: 'Vendors', icon: 'store' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type TabId = (typeof TABS)[number]['id'];

export interface SidebarProps {
  plan: Plan | null;
  tab: TabId;
  onSelectTab: (tab: TabId) => void;
  onReset: () => void;
  tabRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Main sidebar navigation header with branding, progress bar, tab switches and utility actions.
 */
export function Sidebar({
  plan,
  tab,
  onSelectTab,
  onReset,
  tabRefs,
  onKeyDown,
}: SidebarProps): ReactElement {
  const readiness = plan ? planReadiness(plan) : null;

  return (
    <header
      role="banner"
      className="no-print border-b border-line bg-card/95 backdrop-blur-md md:w-72 lg:w-80 md:min-h-screen md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen md:overflow-y-auto md:flex md:flex-col md:justify-between md:shrink-0 z-30 transition-all"
    >
      <div>
        <div className="flex items-center justify-between border-b border-line px-4 py-4 md:border-b-0 md:px-6 md:py-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 shrink-0 shadow-sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold tracking-tight text-ink">
                  {BRAND.name}
                </span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                  {BRAND.nameSuffix}
                </span>
              </div>
              <p className="hidden text-[11px] text-ink-soft md:block mt-0.5 leading-snug">
                {BRAND.subtitle}
              </p>
            </div>
          </div>
        </div>

        {readiness && (
          <div
            className="mx-3 my-3 rounded-xl border border-line bg-paper/60 p-3 md:mx-4"
            aria-label="Plan readiness"
          >
            <p className="flex items-baseline justify-between text-xs font-semibold">
              <span className="text-ink">Plan readiness {readiness.percent}%</span>
              <span className="text-[11px] font-normal text-ink-soft">
                {readiness.tasksDone}/{readiness.tasksTotal} tasks
              </span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card border border-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, readiness.percent))}%` }}
              />
            </div>
            <progress
              className="sr-only"
              max={100}
              value={readiness.percent}
              aria-label="Plan readiness percent"
            />
            <p className="mt-1.5 text-[10px] text-ink-soft text-right">
              {readiness.quotesVerified}/{readiness.quotesTotal} vendors verified
            </p>
          </div>
        )}

        <div className="px-2 py-2 md:px-3">
          <p className="hidden md:block px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Navigation
          </p>
          <div
            role="tablist"
            aria-label="Plan sections"
            className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  className={`flex min-h-11 flex-1 md:flex-initial items-center justify-between md:justify-start gap-2.5 rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-accent to-accent-dark text-on-accent shadow-sm shadow-accent/25 ring-1 ring-accent/30'
                      : 'text-ink-soft hover:bg-paper/80 hover:text-ink'
                  }`}
                  onClick={() => onSelectTab(t.id)}
                  onKeyDown={onKeyDown}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name={t.icon} className="h-4 w-4 shrink-0" />
                    <span>{t.label}</span>
                  </div>
                  {active && (
                    <span className="hidden md:inline-block h-1.5 w-1.5 rounded-full bg-on-accent/90 shrink-0 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {!plan && (
            <div className="mx-1 mt-4 hidden md:block rounded-xl border border-line/70 bg-paper/60 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                  ✦
                </span>
                <span>Quick Start</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                Begin with <strong>Plan setup</strong> to set budget and guests. Timeline and vendor
                tools sync automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      <SidebarActions plan={plan} onReset={onReset} />
    </header>
  );
}
