// from crayons@0.0.194 — theme/context.tsx — READ ONLY
import React, { ReactElement } from "react";
import {
  ThemeProvider as BaseThemeProvider,
  DefaultTheme as BaseDefaultTheme,
} from "@react-navigation/native";
import { colors } from "./colors";

export const DefaultTheme = {
  ...BaseDefaultTheme,
  colors: {
    ...BaseDefaultTheme.colors,
    primary: colors.palette.primary as string,
    primaryTint: colors.palette.lightBlue as string,
    secondary: colors.palette.secondary as string,
    error: colors.palette.error as string,
    background: colors.palette.white as string,
  },
};

export type Theme = typeof DefaultTheme;

interface ThemeProviderProps {
  children: React.ReactNode;
  value: Theme;
}

export const ThemeProvider = ({
  children,
  value,
}: ThemeProviderProps): ReactElement => {
  return <BaseThemeProvider value={value}>{children}</BaseThemeProvider>;
};
