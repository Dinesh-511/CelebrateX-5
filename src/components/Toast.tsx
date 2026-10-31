import { useEffect } from 'react';
import type { Occasion } from '../schemas';
import { describeChanges } from '../lib/format';
import type { ToastData } from '../state/planStore';
import { Icon } from './Icon';

export function Toast({
  toast,
  occasion,
  onDismiss,
}: {
  toast: ToastData | null;
  occasion: Occasion;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const text = toast
    ? [describeChanges(occasion, toast.changes), toast.note].filter(Boolean).join(' ')
    : '';
  return (
    <div
      aria-live="polite"
      role="status"
      className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      {toast && text && (
        <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink/95 backdrop-blur-md px-5 py-3 text-xs sm:text-sm text-paper shadow-elevated border border-ink/20 panel-enter">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
            <Icon name="check" className="h-3.5 w-3.5" />
          </div>
          <p className="flex-1 font-medium leading-relaxed">{text}</p>
          <button
            type="button"
            className="btn min-h-9 shrink-0 text-xs font-bold text-accent hover:text-accent-dark ml-2"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
