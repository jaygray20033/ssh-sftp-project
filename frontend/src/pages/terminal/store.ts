import { create } from 'zustand'
import type { Host, TerminalTabStatus } from '@lib/types'
import type { TerminalThemeName } from './themes'

export interface TerminalTab {
  id: string
  hostId: string
  title: string
  status: TerminalTabStatus
}

export type TerminalTheme = TerminalThemeName

export const TERMINAL_FONT_SIZES = { min: 11, max: 24, step: 1 } as const

const PREFS_KEY = 'shelldeck.terminal.preferences'

const defaultPrefs = { fontSize: 14, theme: 'dark' as TerminalTheme, snippetAutoEnter: false }

function readPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return defaultPrefs
    const parsed = JSON.parse(raw) as Partial<typeof defaultPrefs>
    const fontSize =
      typeof parsed.fontSize === 'number'
        ? Math.min(Math.max(parsed.fontSize, TERMINAL_FONT_SIZES.min), TERMINAL_FONT_SIZES.max)
        : defaultPrefs.fontSize

    return {
      fontSize,
      theme: parsed.theme === 'light' ? ('light' as TerminalTheme) : ('dark' as TerminalTheme),
      snippetAutoEnter: parsed.snippetAutoEnter === true
    }
  } catch {
    return defaultPrefs
  }
}

function writePrefs(prefs: { fontSize: number; theme: TerminalTheme; snippetAutoEnter: boolean }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private-mode storage errors only cost the saved preference.
  }
}

interface TerminalUIState {
  tabs: TerminalTab[]
  activeTabId: string | null
  selectedHostId: string | null
  search: string
  fontSize: number
  theme: TerminalTheme
  // F07: snippets send Enter after the command only when this is on.
  snippetAutoEnter: boolean
  handledIntent: string | null
  openTab: (host: Host) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setTabStatus: (id: string, status: TerminalTabStatus) => void
  setSelectedHostId: (id: string | null) => void
  setSearch: (search: string) => void
  setFontSize: (fontSize: number) => void
  setTheme: (theme: TerminalTheme) => void
  setSnippetAutoEnter: (value: boolean) => void
  markIntentHandled: (value: string | null) => void
}

const prefs = readPrefs()

export const useTerminalStore = create<TerminalUIState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  selectedHostId: null,
  search: '',
  fontSize: prefs.fontSize,
  theme: prefs.theme,
  snippetAutoEnter: prefs.snippetAutoEnter,
  handledIntent: null,

  openTab: (host) => {
    const id = crypto.randomUUID()
    const tab: TerminalTab = { id, hostId: host.id, title: host.name, status: 'connecting' }

    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: id }))

    return id
  },

  closeTab: (id) =>
    set((state) => {
      const tabs = state.tabs.filter((tab) => tab.id !== id)
      const activeTabId = state.activeTabId === id ? (tabs[tabs.length - 1]?.id ?? null) : state.activeTabId

      return { tabs, activeTabId }
    }),

  setActiveTab: (activeTabId) => set({ activeTabId }),

  setTabStatus: (id, status) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, status } : tab))
    })),

  setSelectedHostId: (selectedHostId) => set({ selectedHostId }),
  setSearch: (search) => set({ search }),

  setFontSize: (fontSize) => {
    const size = Math.min(Math.max(fontSize, TERMINAL_FONT_SIZES.min), TERMINAL_FONT_SIZES.max)
    set({ fontSize: size })
    const state = get()
    writePrefs({ fontSize: size, theme: state.theme, snippetAutoEnter: state.snippetAutoEnter })
  },

  setTheme: (theme) => {
    set({ theme })
    const state = get()
    writePrefs({ fontSize: state.fontSize, theme, snippetAutoEnter: state.snippetAutoEnter })
  },

  setSnippetAutoEnter: (snippetAutoEnter) => {
    set({ snippetAutoEnter })
    const state = get()
    writePrefs({ fontSize: state.fontSize, theme: state.theme, snippetAutoEnter })
  },

  markIntentHandled: (handledIntent) => set({ handledIntent })
}))
