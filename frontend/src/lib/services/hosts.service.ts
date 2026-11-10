import { http } from '../axios'
import type { CreateHostRequest, Host, PaginatedHosts, TestHostResult, UpdateHostRequest } from '../types'

// The axios interceptor already unwraps the `{ statusCode, message, data }` envelope.

export async function getHosts(params: { search?: string; tag?: string; limit?: number; offset?: number } = {}) {
  const { data } = await http.get<{ hosts: PaginatedHosts }>('/hosts', { params: { limit: 100, ...params } })
  return data.hosts
}

export async function getHost(id: string): Promise<Host> {
  const { data } = await http.get<{ host: Host }>(`/hosts/${id}`)
  return data.host
}

export async function createHost(payload: CreateHostRequest): Promise<Host> {
  const { data } = await http.post<{ host: Host }>('/hosts', payload)
  return data.host
}

export async function updateHost(id: string, payload: UpdateHostRequest): Promise<Host> {
  const { data } = await http.patch<{ host: Host }>(`/hosts/${id}`, payload)
  return data.host
}

export async function deleteHost(id: string): Promise<void> {
  await http.delete(`/hosts/${id}`)
}

export async function testHost(id: string): Promise<TestHostResult> {
  const { data } = await http.post<TestHostResult>(`/hosts/${id}/test`)
  return data
}

export async function trustHostKey(id: string, fingerprint: string): Promise<Host> {
  const { data } = await http.post<{ host: Host }>(`/hosts/${id}/trust-host-key`, { fingerprint })
  return data.host
}

export const hostsService = { getHosts, getHost, createHost, updateHost, deleteHost, testHost, trustHostKey }
