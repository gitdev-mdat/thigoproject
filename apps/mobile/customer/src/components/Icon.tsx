import { StyleSheet, View } from "react-native";
import { colors, sizes } from "@thigo/design-tokens";

export type IconName =
  | "search"
  | "close"
  | "back"
  | "forward"
  | "plus"
  | "minus"
  | "pin"
  | "home"
  | "receipt"
  | "user"
  | "bag"
  | "check";

type Props = { name: IconName; size?: number; color?: string };

/**
 * Small line icons drawn with views, so the app needs no icon font.
 * Purely decorative: the surrounding control carries the accessible name.
 */
export function Icon({
  name,
  size = sizes.icon.standard,
  color = colors.text.primary
}: Props) {
  const stroke = Math.max(2, Math.round(size / 10));
  const line = { backgroundColor: color, borderRadius: stroke };
  const outline = { borderColor: color, borderWidth: stroke };
  const box = { width: size, height: size };
  const glyph = () => {
    switch (name) {
      case "search":
        return (
          <>
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.66,
                  height: size * 0.66,
                  borderRadius: size,
                  top: 0,
                  left: 0
                }
              ]}
            />
            <View
              style={[
                styles.abs,
                line,
                {
                  width: size * 0.4,
                  height: stroke,
                  right: -size * 0.02,
                  bottom: size * 0.14,
                  transform: [{ rotate: "45deg" }]
                }
              ]}
            />
          </>
        );
      case "close":
      case "plus":
      case "minus":
        return [0, 1].map((index) =>
          name === "minus" && index === 1 ? null : (
            <View
              key={index}
              style={[
                styles.abs,
                line,
                {
                  width: size * 0.86,
                  height: stroke,
                  top: (size - stroke) / 2,
                  left: size * 0.07,
                  transform: [
                    {
                      rotate:
                        name === "close"
                          ? index
                            ? "45deg"
                            : "-45deg"
                          : index
                            ? "90deg"
                            : "0deg"
                    }
                  ]
                }
              ]}
            />
          )
        );
      case "back":
      case "forward":
        return (
          <View
            style={[
              styles.abs,
              {
                width: size * 0.5,
                height: size * 0.5,
                top: size * 0.25,
                left: name === "back" ? size * 0.32 : size * 0.18,
                borderColor: color,
                borderLeftWidth: name === "back" ? stroke : 0,
                borderBottomWidth: name === "back" ? stroke : 0,
                borderRightWidth: name === "forward" ? stroke : 0,
                borderTopWidth: name === "forward" ? stroke : 0,
                transform: [{ rotate: "45deg" }]
              }
            ]}
          />
        );
      case "check":
        return (
          <View
            style={[
              styles.abs,
              {
                width: size * 0.32,
                height: size * 0.62,
                top: size * 0.08,
                left: size * 0.36,
                borderColor: color,
                borderRightWidth: stroke,
                borderBottomWidth: stroke,
                transform: [{ rotate: "45deg" }]
              }
            ]}
          />
        );
      case "pin":
        return (
          <>
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.7,
                  height: size * 0.7,
                  top: size * 0.04,
                  left: size * 0.15,
                  borderTopLeftRadius: size,
                  borderTopRightRadius: size,
                  borderBottomLeftRadius: size,
                  transform: [{ rotate: "45deg" }]
                }
              ]}
            />
            <View
              style={[
                styles.abs,
                {
                  width: size * 0.22,
                  height: size * 0.22,
                  top: size * 0.28,
                  left: size * 0.39,
                  borderRadius: size,
                  backgroundColor: color
                }
              ]}
            />
          </>
        );
      case "home":
        return (
          <>
            <View
              style={[
                styles.abs,
                {
                  width: size * 0.62,
                  height: size * 0.62,
                  top: size * 0.1,
                  left: size * 0.19,
                  borderColor: color,
                  borderLeftWidth: stroke,
                  borderTopWidth: stroke,
                  borderTopLeftRadius: stroke,
                  transform: [{ rotate: "45deg" }]
                }
              ]}
            />
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.62,
                  height: size * 0.46,
                  bottom: size * 0.04,
                  left: size * 0.19,
                  borderTopWidth: 0,
                  borderBottomLeftRadius: stroke,
                  borderBottomRightRadius: stroke
                }
              ]}
            />
          </>
        );
      case "receipt":
        return (
          <>
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.7,
                  height: size * 0.88,
                  top: size * 0.06,
                  left: size * 0.15,
                  borderRadius: stroke * 1.5
                }
              ]}
            />
            {[0.32, 0.5, 0.68].map((top) => (
              <View
                key={top}
                style={[
                  styles.abs,
                  line,
                  {
                    width: size * (top === 0.68 ? 0.22 : 0.36),
                    height: stroke,
                    top: size * top - stroke / 2,
                    left: size * 0.32
                  }
                ]}
              />
            ))}
          </>
        );
      case "user":
        return (
          <>
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.42,
                  height: size * 0.42,
                  top: size * 0.04,
                  left: size * 0.29,
                  borderRadius: size
                }
              ]}
            />
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.8,
                  height: size * 0.38,
                  bottom: size * 0.04,
                  left: size * 0.1,
                  borderTopLeftRadius: size,
                  borderTopRightRadius: size,
                  borderBottomLeftRadius: stroke,
                  borderBottomRightRadius: stroke
                }
              ]}
            />
          </>
        );
      case "bag":
        return (
          <>
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.4,
                  height: size * 0.36,
                  top: size * 0.04,
                  left: size * 0.3,
                  borderBottomWidth: 0,
                  borderTopLeftRadius: size,
                  borderTopRightRadius: size
                }
              ]}
            />
            <View
              style={[
                styles.abs,
                outline,
                {
                  width: size * 0.8,
                  height: size * 0.6,
                  bottom: size * 0.04,
                  left: size * 0.1,
                  borderRadius: stroke * 1.5
                }
              ]}
            />
          </>
        );
    }
  };
  return (
    <View
      style={box}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {glyph()}
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: "absolute" } });
