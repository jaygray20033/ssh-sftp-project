import { useState } from 'react'
import { useDeleteAccountMutation } from './hooks'

export function DangerZone() {
  const mutation = useDeleteAccountMutation()
  const [confirm, setConfirm] = useState(false)
  const errorMsg = mutation.error instanceof Error ? mutation.error.message : ''

  return (
    <div
      className='rounded-3xl p-6 space-y-4'
      style={{
        background: 'rgba(239,68,68,0.04)',
        border: '2px solid rgba(239,68,68,0.2)',
        boxShadow: '0 4px 16px rgba(239,68,68,0.08)'
      }}
    >
      <h2 className='text-base font-bold' style={{ color: 'var(--color-down)' }}>
        Vùng nguy hiểm
      </h2>
      <p className='text-sm' style={{ color: 'var(--color-muted)' }}>
        Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu. Hành động này không thể hoàn tác.
      </p>
      {errorMsg && (
        <div
          className='px-4 py-3 rounded-2xl text-sm font-medium'
          style={{ background: 'rgba(239,68,68,0.07)', border: '2px solid rgba(239,68,68,0.18)', color: '#B91C1C' }}
        >
          {errorMsg}
        </div>
      )}
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className='px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer btn-outline-danger'
          style={{
            color: 'var(--color-down)',
            border: '1.5px solid rgba(239,68,68,0.35)',
            background: 'rgba(239,68,68,0.07)'
          }}
        >
          Xóa tài khoản
        </button>
      ) : (
        <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-confirm'>
          <p className='text-sm font-semibold' style={{ color: 'var(--color-down)' }}>
            Bạn chắc chắn muốn xóa?
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className='px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200'
              style={{ background: 'var(--color-down)', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
            >
              {mutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className='px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 btn-secondary'
              style={{ color: 'var(--color-muted)', border: '1.5px solid var(--color-border-2)' }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
