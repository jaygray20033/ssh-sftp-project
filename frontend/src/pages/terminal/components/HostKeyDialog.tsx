import { ShieldQuestion, ShieldAlert } from 'lucide-react'
import type { TerminalHostKeyPrompt } from '@lib/types'
import { ModalOverlay } from '@components/ui/Modal'

interface HostKeyDialogProps {
  prompt: TerminalHostKeyPrompt
  hostLabel: string
  isAccepting: boolean
  onAccept: () => void
  onReject: () => void
}

export function HostKeyDialog({ prompt, hostLabel, isAccepting, onAccept, onReject }: HostKeyDialogProps) {
  const changed = prompt.status === 'changed'

  return (
    <ModalOverlay onClose={onReject}>
      <div
        role='dialog'
        aria-modal='true'
        aria-label='Xác nhận host key'
        className='w-full max-w-lg rounded-3xl p-6 animate-confirm'
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--text)',
          boxShadow: 'var(--clay-shadow-md)'
        }}
      >
        <div className='flex items-start gap-3'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
            style={{
              background: changed ? 'var(--color-down)' : 'var(--secondary)',
              color: changed ? '#ffffff' : 'var(--text)'
            }}
          >
            {changed ? <ShieldAlert size={20} /> : <ShieldQuestion size={20} />}
          </div>
          <div className='min-w-0'>
            <h3 className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
              {changed ? 'Host key đã thay đổi' : 'Host key mới'}
            </h3>
            <p className='text-sm mt-1' style={{ color: 'var(--color-muted)' }}>
              {changed
                ? ` khoá của ${hostLabel} khác với khoá đã lưu. Nếu bạn không vừa đổi server, đây có thể là tấn công trung gian. Đừng chấp nhận trừ khi chắc chắn.`
                : ` ShellDeck chưa lưu khoá của ${hostLabel}. Hãy đối chiếu fingerprint với quản trị viên trước khi tin tưởng.`}
            </p>
          </div>
        </div>

        <div
          className='mt-4 px-4 py-3 rounded-xl break-all font-mono text-[13px]'
          style={{
            background: 'var(--console-bg)',
            color: 'var(--console-text)',
            border: '1px solid var(--console-border)'
          }}
        >
          {prompt.fingerprint}
        </div>

        <div className='flex flex-wrap items-center justify-end gap-2 mt-5'>
          <button
            onClick={onReject}
            className='px-4 py-2 rounded-xl text-sm font-bold cursor-pointer'
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '2px solid var(--text)',
              boxShadow: '2px 2px 0 var(--text)'
            }}
          >
            Từ chối
          </button>
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className='px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
            style={{
              background: 'var(--cta)',
              border: '2px solid var(--text)',
              boxShadow: '2px 2px 0 var(--text)'
            }}
          >
            {isAccepting ? 'Đang lưu...' : 'Chấp nhận và kết nối'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
