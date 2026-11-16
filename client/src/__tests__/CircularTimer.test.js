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

describe('F2: the timer must not freeze while the parent re-renders every second', () => {
  const commandsOf = (worker) => worker.postMessage.mock.calls.map(([m]) => m.command);

  test('a changing duration prop (the old parent passed remaining) never stops the worker', () => {
    const onTime = jest.fn();
    const { rerender } = render(
      <CircularTimer {...baseProps({ onTimeUpdate: onTime, duration: 1800 })} />
    );
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1];

    // Tick -> parent would re-render with a new remaining-as-duration prop
    act(() => {
      FakeWorker.emit({ type: 'tick', secondsRemaining: 1799, completed: false });
    });
    rerender(<CircularTimer {...baseProps({ onTimeUpdate: onTime, duration: 1799 })} />);
    act(() => {
      FakeWorker.emit({ type: 'tick', secondsRemaining: 1798, completed: false });
    });
    rerender(<CircularTimer {...baseProps({ onTimeUpdate: onTime, duration: 1798 })} />);
    act(() => {
      FakeWorker.emit({ type: 'tick', secondsRemaining: 1797, completed: false });
    });

    // The old reset effect (deps [duration, keyProp]) posted 'stop' on every
    // per-second prop change and the control effect never restarted the
    // worker - the countdown froze ~1 second after start.
    expect(commandsOf(worker).filter((c) => c === 'stop')).toHaveLength(0);
    expect(onTime).toHaveBeenCalledWith(1799);
    expect(onTime).toHaveBeenCalledWith(1798);
    expect(onTime).toHaveBeenCalledWith(1797);
  });

  test('the worker starts once per play session - no per-tick start/stop churn', () => {
    const { rerender } = render(<CircularTimer {...baseProps({ duration: 600 })} />);
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1];

    for (let s = 599; s >= 596; s--) {
      act(() => {
        FakeWorker.emit({ type: 'tick', secondsRemaining: s, completed: false });
      });
      rerender(<CircularTimer {...baseProps({ duration: 600 })} />);
    }

    const starts = commandsOf(worker).filter((c) => c === 'start').length;
    const stops = commandsOf(worker).filter((c) => c === 'stop').length;
    expect(starts).toBe(1);
    expect(stops).toBe(0);
  });

  test('pausing stops the worker and resuming restarts it', () => {
    const { rerender } = render(<CircularTimer {...baseProps({ duration: 600, isPlaying: true })} />);
    const worker = FakeWorker.instances[FakeWorker.instances.length - 1];

    rerender(<CircularTimer {...baseProps({ duration: 600, isPlaying: false })} />);
    expect(commandsOf(worker)).toContain('stop');

    rerender(<CircularTimer {...baseProps({ duration: 600, isPlaying: true })} />);
    expect(commandsOf(worker).filter((c) => c === 'start').length).toBe(2);
  });

  test('switching tasks (keyProp change) resets the countdown to the full duration', () => {
    const { rerender } = render(
      <CircularTimer {...baseProps({ duration: 1800, keyProp: 'task-1' })} />
    );
    act(() => {
      FakeWorker.emit({ type: 'tick', secondsRemaining: 900, completed: false });
    });

    rerender(<CircularTimer {...baseProps({ duration: 2400, keyProp: 'task-2' })} />);

    // 2400 s = 40:00
    expect(screen.getByText(/40:00/)).toBeInTheDocument();
  });
});

describe('F7: timer restore reports through the LATEST callbacks', () => {
  test('a restored paused timer uses the newest onTimeUpdate, not the mount-time one', () => {
    localStorage.setItem(
      'timer_k1',
      JSON.stringify({ remainingTime: 1234, isRunning: false, completed: false })
    );

    const onTimeV1 = jest.fn();
    const onTimeV2 = jest.fn();
    // Mount WITHOUT a task (typical: the store fills in after mount), then
    // the task arrives together with a fresh callback.
    const { rerender } = render(
      <CircularTimer
        {...baseProps({ onTimeUpdate: onTimeV1, isPlaying: false, currentTask: null })}
      />
    );
    rerender(
      <CircularTimer
        {...baseProps({ onTimeUpdate: onTimeV2, isPlaying: false, currentTask: { id: 'k1' } })}
      />
    );

    expect(onTimeV2).toHaveBeenCalledWith(1234);
    expect(onTimeV1).not.toHaveBeenCalled();
  });

  test('a timer that expired while away reports completion through the newest onComplete', () => {
    localStorage.setItem(
      'timer_k1',
      JSON.stringify({ endTime: Date.now() - 5000, isRunning: true, completed: false })
    );

    const onCompleteV1 = jest.fn();
    const onCompleteV2 = jest.fn();
    const { rerender } = render(
      <CircularTimer
        {...baseProps({ onComplete: onCompleteV1, isPlaying: false, currentTask: null })}
      />
    );
    rerender(
      <CircularTimer
        {...baseProps({ onComplete: onCompleteV2, isPlaying: false, currentTask: { id: 'k1' } })}
      />
    );

    expect(onCompleteV2).toHaveBeenCalledTimes(1);
    expect(onCompleteV1).not.toHaveBeenCalled();
  });

  test('a restored paused timer KEEPS its remaining time (reset does not clobber it)', () => {
    localStorage.setItem(
      'timer_k1',
      JSON.stringify({ remainingTime: 1234, isRunning: false, completed: false })
    );

    render(
      <CircularTimer
        {...baseProps({ duration: 1800, isPlaying: false, currentTask: { id: 'k1' } })}
      />
    );

    // The full-duration reset runs first; the saved value must win
    expect(screen.getByText(/20:34/)).toBeInTheDocument();
  });
});
