import { useEffect, useRef } from 'react';
import { planReadiness, vendorChecklist, VENDOR_STATUS_LABELS } from '../engine';
import type { Plan } from '../schemas';
import { Icon } from './Icon';

const TASK_LABEL = { todo: 'To do', done: 'Done', delayed: 'Delayed' } as const;

function Tick({ done, warn = false }: { done: boolean; warn?: boolean }) {
  return done ? (
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok text-paper shadow-2xs">
      <Icon name="check" className="h-3 w-3" />
    </span>
  ) : (
    <span
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
        warn ? 'border-warn bg-warn-soft text-warn' : 'border-line text-ink-soft'
      }`}
    >
      <Icon name={warn ? 'alert' : 'circle'} className="h-2.5 w-2.5" />
    </span>
  );
}

export function ProgressPanel({
  plan,
  open,
  onToggle,
  onNavigate,
}: {
  plan: Plan;
  open: boolean;
  onToggle: () => void;
  onNavigate: (tab: 'timeline' | 'vendors') => void;
}) {
  const readiness = planReadiness(plan);
  const vendors = vendorChecklist(plan);
  const tasks = [...plan.tasks].sort(
    (a, b) => Number(a.status === 'done') - Number(b.status === 'done'),
  );
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="no-print fixed bottom-5 left-5 z-30 flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-card/95 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold text-ink shadow-card hover:shadow-elevated transition-all duration-200"
        aria-expanded={open}
        aria-controls="progress-panel"
        onClick={onToggle}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
          <Icon name="route" className="h-3.5 w-3.5" />
        </div>
        <span>Progress {readiness.percent}%</span>
      </button>

      <aside
        id="progress-panel"
        aria-label="Plan progress"
        hidden={!open}
        className={`no-print fixed inset-y-0 left-0 z-40 ${
          open ? 'flex' : 'hidden'
        } w-[min(24rem,100vw)] flex-col border-r border-line bg-card/95 backdrop-blur-xl shadow-elevated panel-enter`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-ink">Plan progress</h2>
            <span className="badge-verified text-[11px] font-bold">{readiness.percent}% Ready</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn-secondary text-xs px-3 py-1.5"
            onClick={onToggle}
          >
            <Icon name="x" className="h-3.5 w-3.5" />
            Hide
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="rounded-xl border border-line bg-paper/60 p-3.5 text-xs sm:text-sm shadow-2xs">
            <p className="font-semibold text-ink">
              <strong>{readiness.percent}% ready.</strong> {readiness.tasksDone} of{' '}
              {readiness.tasksTotal} tasks done, {readiness.quotesVerified} of{' '}
              {readiness.quotesTotal} vendors confirmed.
            </p>
          </div>

          <section aria-labelledby="progress-vendors" className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <h3
                id="progress-vendors"
                className="text-xs font-bold uppercase tracking-wider text-ink-soft"
              >
                Vendors and quotations
              </h3>
              <button
                type="button"
                className="btn-quiet text-xs font-bold"
                onClick={() => onNavigate('vendors')}
              >
                Open
              </button>
            </div>
            <ul className="space-y-2">
              {vendors.map((item) => (
                <li
                  key={item.category}
                  className="flex items-start gap-2.5 rounded-lg p-1.5 text-xs sm:text-sm hover:bg-paper/40 transition-colors"
                >
                  <Tick done={item.status === 'quote_accepted'} />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{item.label}</p>
                    <p className="text-[11px] text-ink-soft">
                      {VENDOR_STATUS_LABELS[item.status]}
                      {item.quotes > 0 && ` · ${item.quotes} saved`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="progress-tasks" className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <h3
                id="progress-tasks"
                className="text-xs font-bold uppercase tracking-wider text-ink-soft"
              >
                Timeline tasks
              </h3>
              <button
                type="button"
                className="btn-quiet text-xs font-bold"
                onClick={() => onNavigate('timeline')}
              >
                Open
              </button>
            </div>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2.5 rounded-lg p-1.5 text-xs sm:text-sm hover:bg-paper/40 transition-colors"
                >
                  <Tick done={task.status === 'done'} warn={task.status === 'delayed'} />
                  <div className="min-w-0">
                    <p
                      className={`font-semibold text-ink ${task.status === 'done' ? 'text-ink-soft line-through' : ''}`}
                    >
                      {task.title}
                    </p>
                    <p className="text-[11px] text-ink-soft">{TASK_LABEL[task.status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
