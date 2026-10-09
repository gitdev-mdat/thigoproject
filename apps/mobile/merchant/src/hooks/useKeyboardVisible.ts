import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Whether the software keyboard is showing. Pinned footers drop the bottom
 * safe-area inset while it is, because KeyboardAvoidingView already lifts them
 * by the full keyboard height (edge-to-edge on Android, and on iOS).
 * iOS uses the "will" events so the change animates with the keyboard lift.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const shown = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      () => setVisible(true)
    );
    const hidden = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setVisible(false)
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return visible;
}
