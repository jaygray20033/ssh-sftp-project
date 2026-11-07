import { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance, refreshClient } from './config'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    _retry?: boolean
  }
}

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as { message?: string } | undefined
  return new ApiError(error.response?.status ?? 0, body?.message ?? error.message, body)
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function doRefresh(): Promise<string | null> {
  try {
    // RT là HTTP-only cookie, BE tự đọc — không cần gửi body
    type Envelope = { data: { accessToken: string } }
    const res = await refreshClient.post<Envelope>('/auth/refresh-token')
    const { accessToken } = res.data.data
    setAccessToken(accessToken)
    return accessToken
  } catch {
    setAccessToken(null)
    return null
  }
}

export function applyInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!config.skipAuth) {
      const token = getAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      if (response.status === 204) return response
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body) {
        response.data = body.data
      }
      return response
    },
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
      const skip = (original as { skipAuth?: boolean })?.skipAuth

      if (!original || error.response?.status !== 401 || original._retry || skip) {
        return Promise.reject(toApiError(error))
      }

      original._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await doRefresh()
        isRefreshing = false
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        if (!newToken) {
          window.location.href = '/login'
          return Promise.reject(toApiError(error))
        }
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      }

      return new Promise<unknown>((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) return reject(toApiError(error))
          original.headers.Authorization = `Bearer ${token}`
          resolve(axiosInstance(original))
        })
      })
    }
  )
}
