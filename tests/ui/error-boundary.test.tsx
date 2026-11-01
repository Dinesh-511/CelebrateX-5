import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <div>Safe child content</div>;
}

function TestHarness() {
  const [fail, setFail] = useState(true);
  return (
    <ErrorBoundary onReset={() => setFail(false)}>
      <ProblemChild shouldThrow={fail} />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('catches runtime errors and renders an accessible alert dialog', () => {
    const onError = vi.fn();
    // Silence React's default error log during this intentional test error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary onError={onError}>
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('recovers after clicking try again', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<TestHarness />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainBtn);

    expect(screen.getByText('Safe child content')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('supports custom fallback render prop', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary
        fallback={(err, reset) => (
          <div>
            <p>Custom: {err.message}</p>
            <button type="button" onClick={reset}>
              Reset Custom
            </button>
          </div>
        )}
      >
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom: Test explosion')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('triggers window.location.reload when reload page is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    const reloadBtn = screen.getByRole('button', { name: /reload page/i });
    fireEvent.click(reloadBtn);
    expect(reloadMock).toHaveBeenCalled();

    spy.mockRestore();
  });
});
