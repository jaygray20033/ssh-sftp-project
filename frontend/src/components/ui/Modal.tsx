import { X } from 'lucide-react'

export function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

export function ModalCloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className='w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer shrink-0'
      style={{ color: 'var(--color-muted)' }}
    >
      <X size={16} />
    </button>
  )
}
