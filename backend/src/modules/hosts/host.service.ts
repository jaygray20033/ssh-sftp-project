import { AuthType } from '@common/constants/host.constant'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { CryptoService } from '@common/services'
import { Paginated } from '@common/types'
import { assertHostAllowed } from '@common/utils/network-guard'

import { Host } from '@entities/host.entity'

import { CreateHostBody, ListHostsQuery, UpdateHostBody } from './dto'
import { HostResponse, toHostResponse } from './host.mapper'
import HostRepository from './host.repository'
import SshService, { TestHostResult } from './ssh.service'

class HostService {
  static async getHosts(userId: string, query: ListHostsQuery): Promise<Paginated<HostResponse>> {
    const [hosts, total_count] = await HostRepository.findAllByUserId(userId, query)
    return { entries: hosts.map(toHostResponse), limit: query.limit, offset: query.offset, total_count }
  }

  static async getHostById(id: string, userId: string): Promise<HostResponse> {
    return toHostResponse(await this.getOwnedHost(id, userId))
  }

  static async createHost(dto: CreateHostBody, userId: string): Promise<HostResponse> {
    await this.assertNameAvailable(userId, dto.name)
    await assertHostAllowed(dto.hostname)

    const host = await HostRepository.create({
      name: dto.name,
      hostname: dto.hostname,
      port: dto.port,
      username: dto.username,
      authType: dto.authType,
      tags: dto.tags,
      encryptedSecret: CryptoService.encrypt(dto.secret),
      encryptedPassphrase:
        dto.authType === AuthType.PRIVATE_KEY && dto.passphrase ? CryptoService.encrypt(dto.passphrase) : null,
      userId
    })
    return toHostResponse(host)
  }

  static async updateHost(id: string, userId: string, dto: UpdateHostBody): Promise<HostResponse> {
    const current = await this.getOwnedHost(id, userId)
    if (dto.name && dto.name !== current.name) await this.assertNameAvailable(userId, dto.name)
    if (dto.hostname !== undefined && dto.hostname !== current.hostname) await assertHostAllowed(dto.hostname)

    const data: Partial<Host> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.hostname !== undefined) data.hostname = dto.hostname
    if (dto.port !== undefined) data.port = dto.port
    if (dto.username !== undefined) data.username = dto.username
    if (dto.authType !== undefined) data.authType = dto.authType
    if (dto.tags !== undefined) data.tags = dto.tags
    if (dto.secret !== undefined) data.encryptedSecret = CryptoService.encrypt(dto.secret)
    if (dto.passphrase !== undefined) {
      data.encryptedPassphrase = dto.passphrase ? CryptoService.encrypt(dto.passphrase) : null
    }
    // A passphrase only makes sense for private keys.
    if ((dto.authType ?? current.authType) === AuthType.PASSWORD) data.encryptedPassphrase = null

    // The server identity changed: the stored host key fingerprint must be trusted again.
    const addressChanged =
      (dto.hostname !== undefined && dto.hostname !== current.hostname) ||
      (dto.port !== undefined && dto.port !== current.port)
    if (addressChanged) data.hostKeyFingerprint = null

    if (Object.keys(data).length > 0) await HostRepository.update(id, userId, data)
    return this.getHostById(id, userId)
  }

  static async deleteHost(id: string, userId: string) {
    await this.getOwnedHost(id, userId)
    await HostRepository.delete(id, userId)
  }

  static async testHost(id: string, userId: string): Promise<TestHostResult> {
    const host = await this.getOwnedHost(id, userId)
    return SshService.testConnection(host)
  }

  static async trustHostKey(id: string, userId: string, fingerprint: string): Promise<HostResponse> {
    await this.getOwnedHost(id, userId)
    if (SshService.getSeenFingerprint(userId, id) !== fingerprint) {
      throw new BadRequestError('Run a connection test first and confirm the fingerprint it returns')
    }
    await HostRepository.update(id, userId, { hostKeyFingerprint: fingerprint })
    SshService.clearSeenFingerprint(userId, id)
    return this.getHostById(id, userId)
  }

  // Used by SSH/SFTP modules: returns the entity (with encrypted columns) only for the owner.
  static async getOwnedHost(id: string, userId: string): Promise<Host> {
    const host = await HostRepository.findByIdAndUserId(id, userId)
    if (!host) throw new NotFoundError('Host not found')
    return host
  }

  private static async assertNameAvailable(userId: string, name: string) {
    const existing = await HostRepository.findByUserIdAndName(userId, name)
    if (existing) throw new ConflictError('A host with this name already exists')
  }
}

export default HostService
