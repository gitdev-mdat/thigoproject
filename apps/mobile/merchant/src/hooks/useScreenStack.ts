import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler } from "react-native";

/** Returns true when it handled the back request itself (e.g. asked first). */
export type BackGuard = () => boolean;

/**
 * Minimal drill-in stack for one app: push detail screens, pop on back.
 * Android hardware back pops before leaving the app. The top screen may set a
 * guard that header and hardware back both consult before popping.
 */
export function useScreenStack<Route>(root: Route) {
  const [stack, setStack] = useState<Route[]>([root]);
  const guard = useRef<BackGuard | null>(null);
  const push = useCallback(
    (route: Route) => setStack((current) => [...current, route]),
    []
  );
  const pop = useCallback(
    () =>
      setStack((current) =>
        current.length > 1 ? current.slice(0, -1) : current
      ),
    []
  );
  const reset = useCallback(
    (...routes: Route[]) => setStack([root, ...routes]),
    [root]
  );
  /** Pops unless the top screen's guard handles the request. */
  const back = useCallback(() => {
    if (guard.current?.()) return;
    pop();
  }, [pop]);
  /** Sets the guard; returns a cleanup that removes only this guard. */
  const setBackGuard = useCallback((next: BackGuard) => {
    guard.current = next;
    return () => {
      if (guard.current === next) guard.current = null;
    };
  }, []);
  const depth = stack.length;

  useEffect(() => {
    if (depth <= 1) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        back();
        return true;
      }
    );
    return () => subscription.remove();
  }, [depth, back]);

  return {
    route: stack[stack.length - 1] as Route,
    depth,
    push,
    pop,
    back,
    reset,
    setBackGuard
  };
}
