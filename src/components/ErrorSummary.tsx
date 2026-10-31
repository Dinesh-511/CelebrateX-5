import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface FieldError {
  fieldId: string;
  message: string;
}

export function ErrorSummary({ errors, attempt }: { errors: FieldError[]; attempt: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (attempt > 0) ref.current?.focus();
  }, [attempt]);

  if (attempt === 0 || errors.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-h"
      className="rounded-2xl border border-warn/40 bg-warn-soft p-4 sm:p-5 text-warn shadow-soft outline-none"
    >
      <h3
        id="error-summary-h"
        className="flex items-center gap-2 font-bold text-sm sm:text-base text-warn"
      >
        <Icon name="alert" className="h-4 w-4 shrink-0" />
        Please fix {errors.length} {errors.length === 1 ? 'thing' : 'things'} to create your plan
      </h3>
      <ul className="mt-2.5 list-disc space-y-1.5 pl-6 text-xs sm:text-sm">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="font-semibold underline underline-offset-3 hover:text-warn/80"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(error.fieldId)?.focus();
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
