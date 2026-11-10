import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Server } from 'lucide-react'
import type { TestHostResult } from '@lib/types'
import { formatFromNow } from '@lib/format'
import { ConnectionConsole } from './components/ConnectionConsole'
import { HostPicker } from './components/HostPicker'
import { useTerminalHosts, useTestHost, useTrustHostKey } from './hooks'
import { useTerminalStore } from './store'

function Meta({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div
      className='rounded-xl px-3 py-2.5'
      style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}
    >
      <p className='text-[10px] font-bold uppercase tracking-widest' style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
      <p className='text-sm font-bold mt-0.5 truncate' style={{ color: tone ?? 'var(--color-text)' }} title={value}>
        {value}
      </p>
    </div>
  )
}

export default function TerminalPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { hosts, isLoading, isError } = useTerminalHosts()
  const testHost = useTestHost()
  const trustHostKey = useTrustHostKey()
  const { selectedHostId, search, setSelectedHostId, setSearch } = useTerminalStore()
  const [result, setResult] = useState<TestHostResult | null>(null)

  const hostParam = params.get('host')

  useEffect(() => {
    if (hostParam) setSelectedHostId(hostParam)
  }, [hostParam, setSelectedHostId])

  const visibleHosts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return hosts
    return hosts.filter((h) => h.name.toLowerCase().includes(term) || h.hostname.toLowerCase().includes(term))
  }, [hosts, search])

  const host = hosts.find((h) => h.id === selectedHostId) ?? null

  const selectHost = (hostId: string) => {
    setSelectedHostId(hostId)
    setResult(null)
  }

  const runTest = () => {
    if (!host) return
    testHost.mutate(host.id, { onSuccess: setResult })
  }

  const trustKey = (fingerprint: string) => {
    if (!host) return
    trustHostKey.mutate(
      { hostId: host.id, fingerprint },
      {
        onSuccess: () => {
          setResult(null)
          testHost.mutate(host.id, { onSuccess: setResult })
        }
      }
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
            Terminal
          </h1>
          <p className='text-sm mt-0.5 font-medium' style={{ color: 'var(--color-muted)' }}>
            Chọn host để kiểm tra kết nối SSH và xác thực host key
          </p>
        </div>
        <button
          onClick={() => navigate('/hosts')}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all duration-200'
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--clay-shadow-sm)'
          }}
        >
          Quản lý host
          <ArrowRight size={15} />
        </button>
      </div>

      <div className='grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]'>
        <HostPicker
          hosts={visibleHosts}
          selectedId={selectedHostId}
          search={search}
          isLoading={isLoading}
          isError={isError}
          onSearch={setSearch}
          onSelect={selectHost}
        />

        {host ? (
          <div className='space-y-4 min-w-0'>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <Meta
                label='Host key'
                value={host.hostKeyFingerprint ? 'Đã tin tưởng' : 'Chưa xác thực'}
                tone={host.hostKeyFingerprint ? 'var(--color-up)' : 'var(--color-warning)'}
              />
              <Meta label='Xác thực' value={host.authType === 'private_key' ? 'Private key' : 'Mật khẩu'} />
              <Meta label='Kết nối cuối' value={formatFromNow(host.lastConnectedAt)} />
              <Meta label='Thẻ' value={host.tags.length > 0 ? host.tags.join(', ') : 'Không có'} />
            </div>

            <ConnectionConsole
              host={host}
              result={result}
              isTesting={testHost.isPending}
              isTrusting={trustHostKey.isPending}
              onTest={runTest}
              onTrust={trustKey}
              onOpenFiles={(hostId) => navigate(`/files/${hostId}`)}
            />
          </div>
        ) : (
          <div
            className='rounded-3xl flex flex-col items-center justify-center gap-3 text-center min-h-72 px-6'
            style={{
              background: 'var(--color-surface)',
              border: '2px dashed var(--color-border)',
              boxShadow: 'var(--clay-shadow-sm)'
            }}
          >
            <div
              className='w-14 h-14 rounded-2xl flex items-center justify-center'
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Server size={22} />
            </div>
            <p className='text-base font-extrabold' style={{ color: 'var(--color-text)' }}>
              {isLoading || hosts.length === 0 ? 'Chưa có host để kết nối' : 'Chưa chọn host'}
            </p>
            <p className='text-sm max-w-xs' style={{ color: 'var(--color-muted)' }}>
              {hosts.length === 0
                ? 'Thêm máy chủ SSH trong trang Hosts, quay lại đây để kiểm tra kết nối.'
                : 'Chọn một host ở danh sách bên trái để xem thông tin và chạy kiểm tra kết nối.'}
            </p>
            {hosts.length === 0 && !isLoading && (
              <button
                onClick={() => navigate('/hosts')}
                className='mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 btn-primary'
                style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
              >
                Thêm host
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
