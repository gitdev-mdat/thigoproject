export const colors = {
  brand: {
    primary: "#146C43",
    primaryPressed: "#0E5535",
    primarySubtle: "#E7F3EC"
  },
  surface: {
    primary: "#FFFFFF",
    secondary: "#F5F7F6",
    elevated: "#FFFFFF",
    inverse: "#17211B"
  },
  text: {
    primary: "#17211B",
    secondary: "#526158",
    inverse: "#FFFFFF",
    link: "#0E5A38",
    disabled: "#66736B"
  },
  border: {
    default: "#7D8C83",
    subtle: "#D8E0DB",
    focus: "#146C43"
  },
  status: {
    success: "#16663E",
    successBackground: "#E8F5ED",
    warning: "#7A4D00",
    warningBackground: "#FFF4D6",
    danger: "#A1261D",
    dangerBackground: "#FDECEA",
    info: "#175CD3",
    infoBackground: "#EAF1FF"
  },
  action: {
    secondaryPressed: "#E7F3EC",
    disabled: "#D9E0DC",
    destructive: "#B42318",
    destructivePressed: "#8F1D15"
  }
} as const;

export const typography = {
  family: {
    ios: "System",
    android: "sans-serif",
    web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  role: {
    screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
    sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: 700 },
    itemTitle: { fontSize: 16, lineHeight: 22, fontWeight: 600 },
    body: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
    bodySecondary: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
    label: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 500 }
  }
} as const;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const radius = {
  small: 8,
  medium: 12,
  large: 16,
  full: 999
} as const;

export const elevation = {
  none: {
    level: 0,
    webShadow: "none"
  },
  raised: {
    level: 2,
    webShadow: "0 1px 3px rgba(23, 33, 27, 0.14)"
  },
  overlay: {
    level: 8,
    webShadow: "0 8px 24px rgba(23, 33, 27, 0.18)"
  }
} as const;

export const sizes = {
  touchTarget: {
    minimum: 44,
    recommended: 48
  },
  control: {
    compact: 40,
    standard: 48,
    input: 52,
    prominent: 56
  },
  icon: {
    small: 16,
    standard: 20,
    large: 24
  }
} as const;

export const motion = {
  duration: {
    immediate: 0,
    fast: 120,
    standard: 200,
    deliberate: 300
  }
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  elevation,
  sizes,
  motion
} as const;

export type DesignTokens = typeof designTokens;
