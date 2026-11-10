import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HostChooser } from './components/HostChooser'
import { HostFiles } from './components/HostFiles'
import { useFileHost, useFileHosts } from './hooks'

export default function FilesPage() {
  const navigate = useNavigate()
  const { hostId = '' } = useParams()
  const { hosts, isLoading: hostsLoading, isError: hostsError } = useFileHosts()
  const { host, isLoading, isError } = useFileHost(hostId)
  const [search, setSearch] = useState('')

  const visibleHosts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return hosts
    return hosts.filter((h) => h.name.toLowerCase().includes(term) || h.hostname.toLowerCase().includes(term))
  }, [hosts, search])

  const titleHost = hostId ? host?.name : null

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-extrabold' style={{ color: 'var(--color-text)' }}>
          Files
        </h1>
        <p className='text-sm mt-0.5 font-medium' style={{ color: 'var(--color-muted)' }}>
          {hostId ? `Thư mục từ xa trên ${titleHost ?? 'host'}` : 'Chọn một host để mở thư mục từ xa qua SFTP'}
        </p>
      </div>

      {hostId ? (
        <HostFiles
          host={host}
          isLoading={isLoading}
          isError={isError}
          onBack={() => navigate('/files')}
          onOpenTerminal={(id) => navigate(`/terminal?host=${id}`)}
        />
      ) : (
        <HostChooser
          hosts={visibleHosts}
          search={search}
          isLoading={hostsLoading}
          isError={hostsError}
          onSearch={setSearch}
          onOpen={(id) => navigate(`/files/${id}`)}
        />
      )}
    </div>
  )
}
