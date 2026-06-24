export const colors = {
  background: '#F7F8FB',
  navy: '#0B2E6F',
  primary: '#0057D9',
  text: '#07152F',
  muted: '#64748B',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#E53935',
  white: '#FFFFFF',
  grayIcon: '#9CA3AF',
  paleBlue: '#EEF5FF',
};

export type ThemeColor = 'text' | 'background' | 'textSecondary' | 'backgroundSelected' | 'backgroundElement';

export const Colors: Record<'light' | 'dark', Record<ThemeColor, string>> = {
  light: {
    text: '#07152F',
    background: '#F7F8FB',
    textSecondary: '#64748B',
    backgroundSelected: '#EEF5FF',
    backgroundElement: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B1E36',
    textSecondary: '#9CA3AF',
    backgroundSelected: '#1E3A5F',
    backgroundElement: '#1E3A5F',
  },
};

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const MaxContentWidth = 600;

export const Fonts = {
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
} as const;

export const layout = {
  screen: 20,
  card: 18,
  radius: 18,
  buttonHeight: 54,
};
