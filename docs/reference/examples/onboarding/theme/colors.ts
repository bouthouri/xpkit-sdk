// from crayons@0.0.194 — theme/colors.ts — READ ONLY
const palette = {
  white: "#FFFFFF",
  neutral200: "#F4F2F1",
  neutral300: "#D7CEC9",
  neutral400: "#B6ACA6",
  neutral500: "#978F8A",
  neutral600: "#564E4A",
  neutral700: "#3C3836",
  neutral800: "#191015",
  black: "#000000",
  lightBlue: "#7FC7FF",
  primary: "#63B5F6",
  secondary: "#FFC928",
  error: "#EE5250",
  accent100: "#4CD137",
  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const;

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral200,
  /**
   * Fill for interactive input surfaces (text inputs, number inputs, search bars,
   * picker/emoji trigger boxes). Distinct from `background` so inputs don't visually
   * merge with the screen/sheet they sit on.
   */
  inputBackground: palette.white,
  /**
   * The default border color.
   */
  border: palette.black,
  /**
   * The main tinting color.
   */
  tint: palette.secondary,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.error,
  /**
   * Error Background.
   */
  errorBackground: "#FFEBEE",
  /**
   * Warning color.
   */
  warning: palette.secondary,
  /**
   * Warning Background.
   */
  warningBackground: "#FFF9E6",
  /**
   * Success color.
   */
  success: palette.accent100,
  /**
   * Success Background.
   */
  successBackground: "#E8F5E9",
  /**
   * Info/Primary color.
   */
  primary: palette.primary,
  /**
   * Primary light color.
   */
  primaryLight: "#E3F2FD",
  /**
   * Info Background.
   */
  infoBackground: "#E3F2FD",
  /**
   * Card background.
   */
  card: palette.white,
  /**
   * Placeholder text color.
   */
  placeholder: palette.neutral500,
  /**
   * Disabled background.
   */
  disabled: palette.neutral300,
};
