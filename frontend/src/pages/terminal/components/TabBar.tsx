import { Minus, Moon, Plus, Sun, X } from 'lucide-react'
import type { TerminalTabStatus } from '@lib/types'
import { TERMINAL_FONT_SIZES, useTerminalStore, type TerminalTab } from '../store'

const dotColor: Record<TerminalTabStatus, string> = {
  connecting: 'var(--ansi-amber)',
  open: 'var(--ansi-green)',
  closed: 'var(--console-muted)',
  error: 'var(--ansi-red)'
}

const statusLabel: Record<TerminalTabStatus, string> = {
  connecting: 'Đang kết nối',
  open: 'Đang mở',
  closed: 'Đã đóng',
  error: 'Lỗi kết nối'
}

interface TabBarProps {
  tabs: TerminalTab[]
  activeTabId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
}

export function TabBar({ tabs, activeTabId, onSelect, onClose }: TabBarProps) {
  const fontSize = useTerminalStore((state) => state.fontSize)
  const theme = useTerminalStore((state) => state.theme)
  const setFontSize = useTerminalStore((state) => state.setFontSize)
  const setTheme = useTerminalStore((state) => state.setTheme)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='flex flex-1 flex-wrap items-center gap-2 min-w-0'>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              className='flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl cursor-pointer transition-all duration-150'
              style={{
                background: isActive ? 'var(--cta)' : 'var(--color-surface)',
                border: '2px solid var(--text)',
                boxShadow: isActive ? '3px 3px 0 var(--text)' : '2px 2px 0 rgba(45,55,72,0.18)'
              }}
              onClick={() => onSelect(tab.id)}
              title={statusLabel[tab.status]}
            >
              <span
                className='w-2.5 h-2.5 rounded-full shrink-0'
                style={{ background: dotColor[tab.status], border: '1px solid var(--text)' }}
              />
              <span
                className='text-xs font-bold truncate max-w-40'
                style={{ color: isActive ? '#ffffff' : 'var(--color-text)' }}
              >
                {tab.title}
              </span>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  onClose(tab.id)
                }}
                aria-label={`Đóng tab ${tab.title}`}
                className='w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer'
                style={{ color: isActive ? '#ffffff' : 'var(--color-muted)' }}
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>

      <div
        className='flex items-center gap-1 px-2 py-1 rounded-xl'
        style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
      >
        <button
          onClick={() => setFontSize(fontSize - TERMINAL_FONT_SIZES.step)}
          disabled={fontSize <= TERMINAL_FONT_SIZES.min}
          aria-label='Giảm cỡ chữ'
          className='w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
          style={{ color: 'var(--color-text)' }}
        >
          <Minus size={14} />
        </button>
        <span className='text-xs font-bold tabular-nums w-8 text-center' style={{ color: 'var(--color-muted)' }}>
          {fontSize}
        </span>
        <button
          onClick={() => setFontSize(fontSize + TERMINAL_FONT_SIZES.step)}
          disabled={fontSize >= TERMINAL_FONT_SIZES.max}
          aria-label='Tăng cỡ chữ'
          className='w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
          style={{ color: 'var(--color-text)' }}
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
          className='w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer'
          style={{ color: 'var(--color-text)' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}
