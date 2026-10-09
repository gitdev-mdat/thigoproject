import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Tracks the system "reduce motion" preference. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => mounted && setReduce(value)
    );
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}
