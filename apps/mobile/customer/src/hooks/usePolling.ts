import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/** Calls `task` every `intervalMs` while enabled and the app is in the foreground. */
export function usePolling(
  task: () => void,
  intervalMs: number,
  enabled: boolean
) {
  const latest = useRef(task);
  latest.current = task;
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") latest.current();
    }, intervalMs);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") latest.current();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs, enabled]);
}
