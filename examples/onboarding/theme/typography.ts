// from crayons@0.0.194 — theme/typography.ts — READ ONLY
import { Platform } from "react-native";

import {
  SourceCodePro_300Light,
  SourceCodePro_400Regular,
  SourceCodePro_500Medium,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
} from "@expo-google-fonts/source-code-pro";

export const customFontsToLoad = {
  SourceCodePro_300Light,
  SourceCodePro_400Regular,
  SourceCodePro_500Medium,
  SourceCodePro_600SemiBold,
  SourceCodePro_700Bold,
};

const fonts = {
  sourceCodePro: {
    // Cross-platform OTF font.
    light: "sourceCodePro-Light",
    normal: "sourceCodePro-Regular",
    medium: "sourceCodePro-Medium",
    semiBold: "sourceCodePro-SemiBold",
    bold: "sourceCodePro-Bold",
  },
  sourceCodeProAndroid: {
    // Cross-platform Google font.
    light: "SourceCodePro_300Light",
    normal: "SourceCodePro_400Regular",
    medium: "SourceCodePro_500Medium",
    semiBold: "SourceCodePro_600SemiBold",
    bold: "SourceCodePro_700Bold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
};

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: Platform.select({
    ios: fonts.sourceCodePro,
    android: fonts.sourceCodeProAndroid,
  }),
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({
    ios: fonts.helveticaNeue,
    android: fonts.sansSerif,
  }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
};
