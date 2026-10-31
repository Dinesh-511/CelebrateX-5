import { useId, type ReactNode } from 'react';
import type { AiProgress } from '../lib/useAiCall';
import { Icon } from './Icon';
import { LiveThinking } from './ThinkingTrace';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function Field({
  id: fixedId,
  label,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const generated = useId();
  const id = fixedId ?? generated;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-warn">
          <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function EstimateBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="badge-verified">
      <Icon name="check" className="h-3 w-3" /> Verified quotation
    </span>
  ) : (
    <span className="badge-estimate">Estimate</span>
  );
}

export function AiLoading({ label, progress }: { label: string; progress: AiProgress }) {
  return <LiveThinking label={label} progress={progress} />;
}

export function AiError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-warn/30 bg-warn-soft p-4 text-xs sm:text-sm text-warn shadow-soft"
    >
      <p className="flex items-start gap-2 font-bold">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </p>
      <button type="button" className="btn-secondary mt-3 text-xs" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="card py-12 px-6 text-center shadow-soft">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent border border-accent/20">
        <Icon name="pencil" className="h-6 w-6" />
      </div>
      <p className="text-lg sm:text-xl font-bold text-ink max-w-md mx-auto">{title}</p>
      <button type="button" className="btn-primary mt-6 text-xs sm:text-sm px-6" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

export function Confirm({
  prompt,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  prompt: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Confirm action"
      className="mt-3 rounded-2xl border border-line bg-paper/90 p-4 shadow-soft backdrop-blur-sm"
    >
      <p className="text-xs sm:text-sm font-semibold text-ink">{prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <button type="button" className="btn-primary text-xs" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn-secondary text-xs" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
