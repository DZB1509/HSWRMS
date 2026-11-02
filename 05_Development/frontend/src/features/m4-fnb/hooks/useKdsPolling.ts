import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseKdsPollingOptions {
  intervalMs?: number; // Default 12000 (12 seconds, within 10-15s requirement)
  enabled?: boolean;
  onPoll: () => Promise<void> | void;
}

export interface UseKdsPollingReturn {
  isPolling: boolean;
  isManualRefreshing: boolean;
  lastPolledAt: Date | null;
  error: Error | null;
  manualRefresh: () => Promise<void>;
}

/**
 * Custom hook for resilient KDS short-polling (10-15 seconds).
 *
 * Requirements satisfied:
 * - Default 10-15s short-polling interval.
 * - Prevents overlapping/in-flight duplicate requests.
 * - Auto-pauses when tab/document is hidden (visibilitychange).
 * - Properly cleans up timers and aborts/ignores updates on component unmount.
 * - Provides manual refresh capability with loading and error states.
 * - Graceful error handling without UI flickering.
 */
export function useKdsPolling({
  intervalMs = 12000,
  enabled = true,
  onPoll,
}: UseKdsPollingOptions): UseKdsPollingReturn {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const onPollRef = useRef(onPoll);
  onPollRef.current = onPoll;

  const executePoll = useCallback(async (isManual: boolean = false) => {
    if (inFlightRef.current) {
      return; // Prevent overlapping requests
    }

    inFlightRef.current = true;
    if (isManual && isMountedRef.current) {
      setIsManualRefreshing(true);
    }

    try {
      await onPollRef.current();
      if (isMountedRef.current) {
        setLastPolledAt(new Date());
        setError(null);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      inFlightRef.current = false;
      if (isManual && isMountedRef.current) {
        setIsManualRefreshing(false);
      }
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    await executePoll(true);
  }, [executePoll]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Initial fetch on mount / enable
    executePoll(false);

    let timerId: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        // Only poll if document is visible and tab is active
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        executePoll(false);
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger immediate poll when user switches back to active tab
        executePoll(false);
        startTimer();
      } else {
        if (timerId) clearInterval(timerId);
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (timerId) clearInterval(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs, executePoll]);

  return {
    isPolling: enabled,
    isManualRefreshing,
    lastPolledAt,
    error,
    manualRefresh,
  };
}
