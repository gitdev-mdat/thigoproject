import { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";

/**
 * Minimal drill-in stack for one app: push detail screens, pop on back.
 * Android hardware back pops before leaving the app.
 */
export function useScreenStack<Route>(root: Route) {
  const [stack, setStack] = useState<Route[]>([root]);
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
  const depth = stack.length;

  useEffect(() => {
    if (depth <= 1) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        pop();
        return true;
      }
    );
    return () => subscription.remove();
  }, [depth, pop]);

  return { route: stack[stack.length - 1] as Route, depth, push, pop, reset };
}
