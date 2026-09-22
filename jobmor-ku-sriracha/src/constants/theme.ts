/**
 * JobMor Theme
 *
 * This file contains the full design system used across the app:
 *   - JobMor brand colors
 *   - Light / dark mode color map (used by ThemedView / ThemedText)
 *   - Font family references
 *   - Spacing scale
 *   - Layout constants
 *
 * For individual token exports see:
 *   constants/colors.ts   – brand palette
 *   constants/spacing.ts  – spacing & radius
 *   constants/typography.ts – font families, sizes, weights
 */

export const Colors = {
  light: {
    primary: '#08785A',
    onPrimary: '#FFFFFF',
    primaryStrong: '#07543D',
    primarySoft: '#E8F7F1',
    background: '#F7FAF9',
    surface: '#FFFFFF',
    surfaceMuted: '#F0F5F3',
    text: '#10231D',
    textMuted: '#66736E',
    border: '#DCE6E2',
    danger: '#C24141',
  },
  dark: {
    primary: '#5BD4AD',
    onPrimary: '#08130F',
    primaryStrong: '#8BE7C8',
    primarySoft: '#153E32',
    background: '#08130F',
    surface: '#10211B',
    surfaceMuted: '#172C25',
    text: '#F3F8F6',
    textMuted: '#A8BBB4',
    border: '#29463C',
    danger: '#FF8A8A',
  },
} as const;

export type AppTheme = (typeof Colors)['light'];
