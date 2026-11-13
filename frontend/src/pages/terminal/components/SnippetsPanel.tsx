import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { snippetsService } from '@lib/services/snippets.service'
import { getLiveConnection } from '../registry'
import { useTerminalStore } from '../store'

// F07: click a snippet to type it into the active tab. Enter is only appended
// when the "Tự Enter" option is on (stored in the terminal prefs).
export function SnippetsPanel() {
  const tabs = useTerminalStore((state) => state.tabs)
  const activeTabId = useTerminalStore((state) => state.activeTabId)
  const autoEnter = useTerminalStore((state) => state.snippetAutoEnter)
  const setAutoEnter = useTerminalStore((state) => state.setSnippetAutoEnter)

  const qc = useQueryClient()
  const listQuery = useQuery({
    queryKey: ['snippets'],
    queryFn: () => snippetsService.getSnippets({ limit: 100 })
  })

  const [name, setName] = useState('')
  const [command, setCommand] = useState('')

  const create = useMutation({
    mutationFn: () => snippetsService.createSnippet({ name: name.trim(), command }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['snippets'] })
      setName('')
      setCommand('')
      toast.success('Đã thêm snippet')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Không thêm được snippet')
  })

  const remove = useMutation({
    mutationFn: (id: string) => snippetsService.deleteSnippet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snippets'] }),
    onError: () => toast.error('Không xoá được snippet')
  })

  const send = (text: string) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)
    const connection = getLiveConnection(activeTabId)

    if (!connection || activeTab?.status !== 'open') {
      toast.error('Chưa có tab terminal đang kết nối')
      return
    }
    if (!connection.submitText(text, autoEnter)) toast.error('Không gửi được lệnh vào tab hiện tại')
  }

  const snippets = listQuery.data?.entries ?? []

  return (
    <aside
      className='rounded-3xl p-4 flex flex-col gap-3'
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        boxShadow: 'var(--clay-shadow-sm)'
      }}
    >
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs font-bold uppercase tracking-widest' style={{ color: 'var(--color-muted)' }}>
          Snippets
        </p>
        <label
          className='flex items-center gap-1.5 text-[11px] font-bold cursor-pointer'
          style={{ color: 'var(--color-text)' }}
          title='Bấm snippet sẽ gửi kèm phím Enter chạy lệnh ngay'
        >
          <input type='checkbox' checked={autoEnter} onChange={(e) => setAutoEnter(e.target.checked)} />
          Tự Enter
        </label>
      </div>

      {listQuery.isLoading ? (
        <div className='flex items-center justify-center gap-2 py-6'>
          <Loader2 size={14} className='animate-spin' />
          <span className='text-xs' style={{ color: 'var(--color-muted)' }}>
            Đang tải snippets...
          </span>
        </div>
      ) : listQuery.isError ? (
        <p className='text-xs py-4 text-center' style={{ color: 'var(--color-down)' }}>
          Không tải được snippets.
        </p>
      ) : snippets.length === 0 ? (
        <p className='text-xs py-4 text-center' style={{ color: 'var(--color-muted)' }}>
          Chưa có snippet nào. Thêm ở dưới.
        </p>
      ) : (
        <div className='flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5'>
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className='flex items-center gap-1.5 rounded-xl pl-3 pr-1.5 py-2'
              style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}
            >
              <button
                onClick={() => send(snippet.command)}
                className='flex-1 min-w-0 text-left cursor-pointer py-0.5'
                title={snippet.description ?? snippet.command}
              >
                <span className='block text-xs font-bold truncate' style={{ color: 'var(--color-text)' }}>
                  {snippet.name}
                </span>
                <span className='block text-[11px] font-mono truncate' style={{ color: 'var(--color-muted)' }}>
                  {snippet.command}
                </span>
              </button>
              <button
                onClick={() => window.confirm(`Xoá snippet "${snippet.name}"?`) && remove.mutate(snippet.id)}
                title='Xoá snippet'
                aria-label='Xoá snippet'
                className='w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer shrink-0 hover:opacity-70'
                style={{ color: 'var(--color-muted)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        className='flex flex-col gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() && command.trim()) create.mutate()
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder='Tên snippet'
          className='w-full px-3 py-2 rounded-xl text-xs font-medium outline-none'
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)'
          }}
        />
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          maxLength={4096}
          placeholder='Lệnh, ví dụ: df -h'
          spellCheck={false}
          className='w-full px-3 py-2 rounded-xl text-xs font-mono outline-none'
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)'
          }}
        />
        <button
          type='submit'
          disabled={!name.trim() || !command.trim() || create.isPending}
          className='flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50'
          style={{ background: 'var(--cta)', boxShadow: '2px 2px 0 var(--text)' }}
        >
          {create.isPending ? <Loader2 size={13} className='animate-spin' /> : <Plus size={13} />}
          Thêm snippet
        </button>
      </form>
    </aside>
  )
}
