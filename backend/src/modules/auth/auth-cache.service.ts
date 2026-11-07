import { randomBytes } from 'node:crypto'

import NodeCache from 'node-cache'

const STATE_TTL_SECONDS = 10 * 60
const TWO_FACTOR_TOKEN_TTL_SECONDS = 5 * 60
const TOKEN_BYTES = 32

type TwoFactorTokenData = {
  userId: string
  secret: string
}

class AuthCacheService {
  static generateOAuthState(): string {
    return this.setToken('oauth:state', true, STATE_TTL_SECONDS)
  }

  static consumeOAuthState(state: string): boolean {
    return this.consumeToken<boolean>('oauth:state', state) === true
  }

  static generateTwoFactorToken(userId: string, secret: string): string {
    return this.setToken<TwoFactorTokenData>('2fa:token', { userId, secret }, TWO_FACTOR_TOKEN_TTL_SECONDS)
  }

  static getTwoFactorTokenData(token: string): TwoFactorTokenData | null {
    return this.peekToken<TwoFactorTokenData>('2fa:token', token)
  }

  static consumeTwoFactorToken(token: string): TwoFactorTokenData | null {
    return this.consumeToken<TwoFactorTokenData>('2fa:token', token)
  }

  static generatePendingLoginToken(userId: string): string {
    return this.setToken<string>('2fa:pending', userId, TWO_FACTOR_TOKEN_TTL_SECONDS)
  }

  static peekPendingLoginToken(token: string): string | null {
    return this.peekToken<string>('2fa:pending', token)
  }

  static consumePendingLoginToken(token: string): string | null {
    return this.consumeToken<string>('2fa:pending', token)
  }

  private static cache: NodeCache = new NodeCache({
    stdTTL: STATE_TTL_SECONDS,
    checkperiod: 60,
    deleteOnExpire: true,
    useClones: false
  })

  private static generateToken(): string {
    return randomBytes(TOKEN_BYTES).toString('hex')
  }

  private static getKey(namespace: string, token: string): string {
    return `${namespace}:${token}`
  }

  private static setToken<T>(namespace: string, value: T, ttlSeconds: number): string {
    const token = this.generateToken()

    this.cache.set(this.getKey(namespace, token), value, ttlSeconds)

    return token
  }

  private static peekToken<T>(namespace: string, token: string): T | null {
    return this.cache.get<T>(this.getKey(namespace, token)) ?? null
  }

  private static consumeToken<T>(namespace: string, token: string): T | null {
    const key = this.getKey(namespace, token)
    const value = this.cache.get<T>(key) ?? null

    this.cache.del(key)

    return value
  }
}

export default AuthCacheService
