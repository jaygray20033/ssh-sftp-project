import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Server, SquareTerminal } from 'lucide-react'
import type { TestHostResult } from '@lib/types'
import { formatFromNow } from '@lib/format'
import { ConnectionConsole } from './components/ConnectionConsole'
import { HostPicker } from './components/HostPicker'
import { SnippetsPanel } from './components/SnippetsPanel'
import { TabBar } from './components/TabBar'
import { TerminalTabView } from './components/TerminalTab'
import { useLeaveGuard, useTerminalHosts, useTestHost, useTrustHostKey } from './hooks'
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
  const {
    tabs,
    activeTabId,
    selectedHostId,
    search,
    handledIntent,
    openTab,
    closeTab,
    setActiveTab,
    setSelectedHostId,
    setSearch,
    markIntentHandled
  } = useTerminalStore()
  const [result, setResult] = useState<TestHostResult | null>(null)

  const hostParam = params.get('host')

  useEffect(() => {
    if (hostParam) setSelectedHostId(hostParam)
  }, [hostParam, setSelectedHostId])

  // Hosts and the dashboard push ?host= to ask for a new tab; the store flag keeps a remount from opening twice.
  useEffect(() => {
    if (!hostParam) {
      if (handledIntent) markIntentHandled(null)
      return
    }
    if (handledIntent === hostParam) return

    const target = hosts.find((item) => item.id === hostParam)
    if (!target) return

    markIntentHandled(hostParam)
    openTab(target)
    navigate('/terminal', { replace: true })
  }, [hostParam, hosts, handledIntent, markIntentHandled, openTab, navigate])

  useLeaveGuard(tabs.some((tab) => tab.status === 'connecting' || tab.status === 'open'))

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
            Mở nhiều phiên SSH cùng lúc, xác thực host key ngay lần kết nối đầu
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => host && openTab(host)}
            disabled={!host}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 btn-primary'
            style={{ background: 'var(--cta)', boxShadow: 'var(--clay-shadow-btn)' }}
          >
            <SquareTerminal size={15} />
            Mở terminal
          </button>
          <Link
            to='/hosts'
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
          </Link>
        </div>
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

        {tabs.length > 0 ? (
          <div className='space-y-4 min-w-0'>
            <TabBar tabs={tabs} activeTabId={activeTabId} onSelect={setActiveTab} onClose={closeTab} />

            <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem] items-start'>
              <div className='min-w-0 space-y-4'>
                {tabs.map((tab) => (
                  <TerminalTabView
                    key={tab.id}
                    tab={tab}
                    host={hosts.find((item) => item.id === tab.hostId)}
                    isActive={tab.id === activeTabId}
                  />
                ))}
              </div>
              <SnippetsPanel />
            </div>
          </div>
        ) : host ? (
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
