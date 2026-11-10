import { useCallback, useEffect, useRef, useState } from "react";

import type { Navigation } from "../screens/routes";

type Options = {
  /** The draft differs from the saved state. */
  dirty: boolean;
  /** A save is in flight; back is ignored until it settles. */
  busy: boolean;
  nav: Pick<Navigation, "back" | "setBackGuard">;
};

/**
 * Asks "Bỏ thay đổi?" when header or hardware back would drop unsaved edits.
 * Call `leave` to exit without asking, e.g. right after a successful save.
 */
export function useLeaveGuard({ dirty, busy, nav }: Options) {
  const { back, setBackGuard } = nav;
  const [confirming, setConfirming] = useState(false);
  const latest = useRef({ dirty, busy });
  const leaving = useRef(false);

  useEffect(() => {
    latest.current = { dirty, busy };
  }, [dirty, busy]);

  useEffect(
    () =>
      setBackGuard(() => {
        if (leaving.current) return false;
        if (latest.current.busy) return true;
        if (!latest.current.dirty) return false;
        setConfirming(true);
        return true;
      }),
    [setBackGuard]
  );

  const leave = useCallback(() => {
    leaving.current = true;
    setConfirming(false);
    back();
  }, [back]);
  const stay = useCallback(() => setConfirming(false), []);

  return { confirming, leave, stay };
}
