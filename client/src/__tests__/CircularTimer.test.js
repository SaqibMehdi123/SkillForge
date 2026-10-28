/**
 * C6: CircularTimer's worker onmessage handler was installed inside an
 * empty-deps useEffect, so it captured the FIRST render's onComplete /
 * onTimeUpdate props forever. When the parent passes a fresh callback
 * (whose closure holds current task data), the worker still invoked the
 * stale one - so session completion never auto-saved.
 *
 * The fix routes worker messages through refs that always point at the
 * latest callbacks. These tests verify exactly that behaviour.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CircularTimer from '../components/practice/CircularTimer';

class FakeWorker {
  static instances = [];
  constructor(_url) {
    this.onmessage = null;
    this.postMessage = jest.fn();
    this.terminate = jest.fn();
    FakeWorker.instances.push(this);
  }
  /** Simulate the worker posting a tick/completion message. */
  static emit(data) {
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1];
    if (worker && typeof worker.onmessage === 'function') {
      worker.onmessage({ data });
    }
  }
}

beforeAll(() => {
  window.Worker = FakeWorker;
});

beforeEach(() => {
  FakeWorker.instances = [];
  localStorage.clear();
});

const baseProps = (overrides = {}) => ({
  isPlaying: true,
  duration: 60,
  keyProp: 'k1',
  onComplete: jest.fn(),
  onStart: jest.fn(),
  onStop: jest.fn(),
  onReset: jest.fn(),
  onResume: jest.fn(),
  onTimeUpdate: jest.fn(),
  sessionName: 'Guitar',
  sessionIndex: 1,
  totalSessions: 1,
  inactive: false,
  ...overrides,
});

test('worker completion invokes the LATEST onComplete, not the mount-time one', () => {
  const onCompleteV1 = jest.fn();
  const onCompleteV2 = jest.fn();

  const { rerender } = render(<CircularTimer {...baseProps({ onComplete: onCompleteV1 })} />);

  // The parent re-renders and passes a fresh callback (new closure over
  // current task data) - the component must keep using the newest one.
  rerender(<CircularTimer {...baseProps({ onComplete: onCompleteV2 })} />);

  act(() => {
    FakeWorker.emit({ type: 'tick', secondsRemaining: 0, completed: true });
  });

  expect(onCompleteV2).toHaveBeenCalledTimes(1);
  expect(onCompleteV1).not.toHaveBeenCalled();
});

test('worker ticks invoke the LATEST onTimeUpdate with the remaining seconds', () => {
  const onTimeV1 = jest.fn();
  const onTimeV2 = jest.fn();

  const { rerender } = render(<CircularTimer {...baseProps({ onTimeUpdate: onTimeV1 })} />);
  rerender(<CircularTimer {...baseProps({ onTimeUpdate: onTimeV2 })} />);

  act(() => {
    FakeWorker.emit({ type: 'tick', secondsRemaining: 42, completed: false });
  });

  expect(onTimeV2).toHaveBeenCalledWith(42);
  expect(onTimeV1).not.toHaveBeenCalled();
});

test('the displayed countdown reflects worker ticks', () => {
  render(<CircularTimer {...baseProps({})} />);

  act(() => {
    FakeWorker.emit({ type: 'tick', secondsRemaining: 37, completed: false });
  });

  expect(screen.getByText(/37/)).toBeInTheDocument();
});
