import { AlertTriangle, ArrowLeft, FolderOpen, Loader2, SquareTerminal } from 'lucide-react'
import type { Host } from '@lib/types'
import { formatFromNow } from '@lib/format'

interface HostFilesProps {
  host: Host | null
  isLoading: boolean
  isError: boolean
  onBack: () => void
  onOpenTerminal: (hostId: string) => void
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className='rounded-xl px-3 py-2.5'
      style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
    >
      <p className='text-[10px] font-bold uppercase tracking-widest' style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
      <p className='text-sm font-bold mt-0.5 truncate' style={{ color: 'var(--color-text)' }} title={value}>
        {value}
      </p>
    </div>
  )
}

export function HostFiles({ host, isLoading, isError, onBack, onOpenTerminal }: HostFilesProps) {
  const panel = {
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    boxShadow: 'var(--clay-shadow-md)'
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center gap-2 py-24'>
        <Loader2 size={16} className='animate-spin' />
        <span className='text-sm font-medium' style={{ color: 'var(--color-muted)' }}>
          Đang mở host...
        </span>
      </div>
    )
  }

  if (isError || !host) {
    return (
      <div className='rounded-3xl p-8 flex flex-col items-center gap-4 text-center' style={panel}>
        <div
          className='w-14 h-14 rounded-2xl flex items-center justify-center'
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-down)' }}
        >
          <AlertTriangle size={22} />
        </div>
        <p className='text-lg font-extrabold' style={{ color: 'var(--color-text)' }}>
          Không tìm thấy host này
        </p>
        <p className='text-sm max-w-xs' style={{ color: 'var(--color-muted)' }}>
          Host có thể đã bị xoá hoặc không thuộc tài khoản của bạn.
        </p>
        <button
          onClick={onBack}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer'
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1.5px solid var(--color-border)'
          }}
        >
          <ArrowLeft size={15} />
          Chọn host khác
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div
        className='rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4'
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--clay-shadow-sm)'
        }}
      >
        <div
          className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0'
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <FolderOpen size={20} />
        </div>
        <div className='flex-1 min-w-0'>
          <h2 className='text-base font-extrabold truncate' style={{ color: 'var(--color-text)' }}>
            {host.name}
          </h2>
          <p className='text-xs mt-0.5 truncate font-mono' style={{ color: 'var(--color-muted)' }}>
            {host.username}@{host.hostname}:{host.port}
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={onBack}
            className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer'
            style={{
              background: 'var(--color-bg)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <ArrowLeft size={14} />
            Đổi host
          </button>
          <button
            onClick={() => onOpenTerminal(host.id)}
            className='flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer'
            style={{ background: 'var(--cta)', border: '1.5px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
          >
            <SquareTerminal size={14} />
            Terminal
          </button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Tile label='Host key' value={host.hostKeyFingerprint ? 'Đã tin tưởng' : 'Chưa xác thực'} />
        <Tile label='Xác thực' value={host.authType === 'private_key' ? 'Private key' : 'Mật khẩu'} />
        <Tile label='Kết nối cuối' value={formatFromNow(host.lastConnectedAt)} />
        <Tile label='Thẻ' value={host.tags.length > 0 ? host.tags.join(', ') : 'Không có'} />
      </div>

      {host.hostKeyFingerprint ? (
        <div className='rounded-3xl overflow-hidden' style={panel}>
          <div
            className='grid grid-cols-[minmax(0,1fr)_6rem_11rem_6rem] gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest'
            style={{ color: 'var(--color-muted)', borderBottom: '1.5px solid var(--color-border)' }}
          >
            <span>Tên</span>
            <span>Kích thước</span>
            <span>Ngày sửa</span>
            <span>Quyền</span>
          </div>
          <div className='px-5 py-12 flex flex-col items-center gap-3 text-center'>
            <div
              className='w-12 h-12 rounded-2xl flex items-center justify-center'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <FolderOpen size={20} />
            </div>
            <p className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
              Server chưa bật API SFTP
            </p>
            <p className='text-sm max-w-md' style={{ color: 'var(--color-muted)' }}>
              Danh sách thư mục, upload và tải xuống cần module SFTP ở backend. Host này đã sẵn sàng: host key đã được
              tin tưởng.
            </p>
            <button
              onClick={() => onOpenTerminal(host.id)}
              className='mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer'
              style={{
                background: 'var(--secondary)',
                color: 'var(--text)',
                border: '2px solid var(--text)',
                boxShadow: '2px 2px 0 var(--text)'
              }}
            >
              <SquareTerminal size={15} />
              Mở Terminal cho host này
            </button>
          </div>
        </div>
      ) : (
        <div
          className='rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4'
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '2px solid var(--color-warning)',
            boxShadow: 'var(--clay-shadow-sm)'
          }}
        >
          <div
            className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0'
            style={{ background: 'var(--color-surface)', color: 'var(--color-warning)' }}
          >
            <AlertTriangle size={20} />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-extrabold' style={{ color: 'var(--color-text)' }}>
              Cần tin tưởng host key trước khi duyệt file
            </p>
            <p className='text-sm mt-0.5' style={{ color: 'var(--color-muted)' }}>
              ShellDeck chỉ mở SFTP với host đã xác thực fingerprint để chống tấn công trung gian.
            </p>
          </div>
          <button
            onClick={() => onOpenTerminal(host.id)}
            className='shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer'
            style={{ background: 'var(--cta)', border: '2px solid var(--text)', boxShadow: '2px 2px 0 var(--text)' }}
          >
            Kiểm tra host ngay
          </button>
        </div>
      )}
    </div>
  )
}
