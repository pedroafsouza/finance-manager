export interface Theme {
  name: string;
  label: string;
  colors: {
    light: {
      background: string;
      foreground: string;
      card: string;
      cardForeground: string;
      popover: string;
      popoverForeground: string;
      primary: string;
      primaryForeground: string;
      secondary: string;
      secondaryForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      destructive: string;
      destructiveForeground: string;
      border: string;
      input: string;
      ring: string;
    };
    dark: {
      background: string;
      foreground: string;
      card: string;
      cardForeground: string;
      popover: string;
      popoverForeground: string;
      primary: string;
      primaryForeground: string;
      secondary: string;
      secondaryForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      destructive: string;
      destructiveForeground: string;
      border: string;
      input: string;
      ring: string;
    };
  };
}

export const themes: Theme[] = [
  {
    name: 'blue',
    label: 'Ocean Blue',
    colors: {
      light: {
        background: '#ffffff',
        foreground: '#0f172a',
        card: '#ffffff',
        cardForeground: '#0f172a',
        popover: '#ffffff',
        popoverForeground: '#0f172a',
        primary: '#3b82f6',
        primaryForeground: '#f8fafc',
        secondary: '#f1f5f9',
        secondaryForeground: '#1e293b',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        accent: '#f1f5f9',
        accentForeground: '#1e293b',
        destructive: '#ef4444',
        destructiveForeground: '#f8fafc',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#3b82f6',
      },
      dark: {
        background: '#0f172a',
        foreground: '#f8fafc',
        card: '#1e293b',
        cardForeground: '#f8fafc',
        popover: '#1e293b',
        popoverForeground: '#f8fafc',
        primary: '#60a5fa',
        primaryForeground: '#0f172a',
        secondary: '#334155',
        secondaryForeground: '#f8fafc',
        muted: '#334155',
        mutedForeground: '#94a3b8',
        accent: '#334155',
        accentForeground: '#f8fafc',
        destructive: '#dc2626',
        destructiveForeground: '#f8fafc',
        border: '#334155',
        input: '#334155',
        ring: '#3b82f6',
      },
    },
  },
  {
    name: 'purple',
    label: 'Royal Purple',
    colors: {
      light: {
        background: '#ffffff',
        foreground: '#1e1b4b',
        card: '#ffffff',
        cardForeground: '#1e1b4b',
        popover: '#ffffff',
        popoverForeground: '#1e1b4b',
        primary: '#8b5cf6',
        primaryForeground: '#f5f3ff',
        secondary: '#f5f3ff',
        secondaryForeground: '#312e81',
        muted: '#f5f3ff',
        mutedForeground: '#6b7280',
        accent: '#f5f3ff',
        accentForeground: '#312e81',
        destructive: '#ef4444',
        destructiveForeground: '#f8fafc',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#8b5cf6',
      },
      dark: {
        background: '#1e1b4b',
        foreground: '#f5f3ff',
        card: '#312e81',
        cardForeground: '#f5f3ff',
        popover: '#312e81',
        popoverForeground: '#f5f3ff',
        primary: '#a78bfa',
        primaryForeground: '#1e1b4b',
        secondary: '#4c1d95',
        secondaryForeground: '#f5f3ff',
        muted: '#4c1d95',
        mutedForeground: '#c4b5fd',
        accent: '#4c1d95',
        accentForeground: '#f5f3ff',
        destructive: '#dc2626',
        destructiveForeground: '#f8fafc',
        border: '#4c1d95',
        input: '#4c1d95',
        ring: '#8b5cf6',
      },
    },
  },
  {
    name: 'emerald',
    label: 'Forest Emerald',
    colors: {
      light: {
        background: '#ffffff',
        foreground: '#064e3b',
        card: '#ffffff',
        cardForeground: '#064e3b',
        popover: '#ffffff',
        popoverForeground: '#064e3b',
        primary: '#10b981',
        primaryForeground: '#f0fdf4',
        secondary: '#f0fdf4',
        secondaryForeground: '#065f46',
        muted: '#f0fdf4',
        mutedForeground: '#6b7280',
        accent: '#f0fdf4',
        accentForeground: '#065f46',
        destructive: '#ef4444',
        destructiveForeground: '#f8fafc',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#10b981',
      },
      dark: {
        background: '#064e3b',
        foreground: '#f0fdf4',
        card: '#065f46',
        cardForeground: '#f0fdf4',
        popover: '#065f46',
        popoverForeground: '#f0fdf4',
        primary: '#34d399',
        primaryForeground: '#064e3b',
        secondary: '#047857',
        secondaryForeground: '#f0fdf4',
        muted: '#047857',
        mutedForeground: '#a7f3d0',
        accent: '#047857',
        accentForeground: '#f0fdf4',
        destructive: '#dc2626',
        destructiveForeground: '#f8fafc',
        border: '#047857',
        input: '#047857',
        ring: '#10b981',
      },
    },
  },
];

export function applyTheme(themeName: string, isDark: boolean) {
  const theme = themes.find((t) => t.name === themeName);
  if (!theme) return;

  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
}
