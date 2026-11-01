import { useState, type ReactElement } from 'react';
import type { Plan } from '../schemas';
import { shareHash } from '../state/share';
import { useTheme } from '../lib/theme';
import { Icon } from './Icon';
import { Confirm } from './ui';

export interface SidebarActionsProps {
  plan: Plan | null;
  onReset: () => void;
}

/**
 * Sidebar actions footer: theme switcher, print trigger, share link generator, and reset dialog.
 */
export function SidebarActions({ plan, onReset }: SidebarActionsProps): ReactElement {
  const [confirmReset, setConfirmReset] = useState(false);
  const [share, setShare] = useState<{ status: 'copied' | 'manual'; url: string } | null>(null);
  const { theme, toggle } = useTheme();

  async function copyLink(current: Plan): Promise<void> {
    const url = `${window.location.origin}${window.location.pathname}${shareHash(current)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: 'copied', url });
    } catch {
      setShare({ status: 'manual', url });
    }
  }

  return (
    <div className="border-t border-line p-3 md:p-4 space-y-2 mt-auto">
      <p className="hidden md:block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
        Actions & Workspace
      </p>
      <div
        className={
          plan ? 'flex items-center gap-1.5 md:grid md:grid-cols-2' : 'flex items-center w-full'
        }
      >
        <button
          type="button"
          className={`btn-secondary px-2.5 py-2 text-xs flex items-center justify-center gap-2 ${plan ? 'flex-1 md:flex-none' : 'w-full'}`}
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4 text-accent" />
          <span className="sr-only sm:not-sr-only text-xs">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {plan && (
          <>
            <button
              type="button"
              className="btn-secondary px-2.5 py-2 text-xs flex items-center justify-center gap-2 flex-1 md:flex-none"
              onClick={() => void copyLink(plan)}
            >
              <Icon name="link" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only text-xs">Share link</span>
            </button>
            <button
              type="button"
              className="btn-secondary px-2.5 py-2 text-xs flex items-center justify-center gap-2 flex-1 md:flex-none"
              onClick={() => window.print()}
            >
              <Icon name="printer" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only text-xs">Print summary</span>
            </button>
            <button
              type="button"
              className="btn-secondary px-2.5 py-2 text-xs flex items-center justify-center gap-2 flex-1 md:flex-none"
              onClick={() => setConfirmReset(true)}
            >
              <Icon name="reset" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only text-xs">Reset</span>
            </button>
          </>
        )}
      </div>

      <div aria-live="polite">
        {share?.status === 'copied' && (
          <p className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-ok">
            <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
            Link copied. Anyone with it can open this plan.
          </p>
        )}
        {share?.status === 'manual' && (
          <div className="pt-2">
            <label htmlFor="share-url" className="label text-[11px]">
              Copy this link
            </label>
            <input
              id="share-url"
              readOnly
              className="input text-xs py-1"
              value={share.url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
      </div>

      {confirmReset && (
        <div className="pt-2">
          <Confirm
            prompt="Reset the whole plan? Your current budget, timeline and quotations will be erased."
            confirmLabel="Yes, reset"
            onConfirm={() => {
              setConfirmReset(false);
              onReset();
            }}
            onCancel={() => setConfirmReset(false)}
          />
        </div>
      )}
    </div>
  );
}
