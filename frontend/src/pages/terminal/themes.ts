import type { ITheme } from '@xterm/xterm'

const ansiDark = {
  black: '#2a3441',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#e879f9',
  cyan: '#22d3ee',
  white: '#e6edf5',
  brightBlack: '#94a3b8',
  brightRed: '#fca5a5',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: '#f5abfc',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff'
}

const ansiLight = {
  black: '#2d3748',
  red: '#dc2626',
  green: '#15803d',
  yellow: '#b45309',
  blue: '#1d4ed8',
  magenta: '#a21caf',
  cyan: '#0e7490',
  white: '#cbd5e1',
  brightBlack: '#64748b',
  brightRed: '#ef4444',
  brightGreen: '#16a34a',
  brightYellow: '#d97706',
  brightBlue: '#3b82f6',
  brightMagenta: '#c026d3',
  brightCyan: '#0891b2',
  brightWhite: '#f8fafc'
}

export interface TerminalSurface {
  background: string
  foreground: string
  border: string
  muted: string
}

export type TerminalThemeName = 'dark' | 'light'

const surfaces: Record<TerminalThemeName, { theme: ITheme; surface: TerminalSurface }> = {
  dark: {
    theme: {
      ...ansiDark,
      background: '#1f2733',
      foreground: '#e6edf5',
      cursor: '#4ade80',
      cursorAccent: '#1f2733',
      selectionBackground: '#3b4757'
    },
    surface: { background: '#1f2733', foreground: '#e6edf5', border: '#3b4757', muted: '#94a3b8' }
  },
  light: {
    theme: {
      ...ansiLight,
      background: '#fff9f5',
      foreground: '#2d3748',
      cursor: '#22c55e',
      cursorAccent: '#fff9f5',
      selectionBackground: '#fdbcb4'
    },
    surface: { background: '#fff9f5', foreground: '#2d3748', border: '#e2d5cd', muted: '#8a7d72' }
  }
}

export function terminalTheme(name: TerminalThemeName): ITheme {
  return surfaces[name].theme
}

export function terminalSurface(name: TerminalThemeName): TerminalSurface {
  return surfaces[name].surface
}
