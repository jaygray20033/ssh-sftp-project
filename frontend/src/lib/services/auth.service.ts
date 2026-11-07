import { http } from '../axios'
import type {
  AuthUser,
  AuthResponse,
  RefreshResponse,
  TwoFactorRequired,
  TwoFactorSetup,
  RegisterRequest,
  LoginPasswordRequest,
  Login2FARequest,
  GoogleOAuthUrlResponse,
  GoogleCallbackRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  Confirm2FARequest,
  Disable2FARequest
} from '../types'

export interface RegisterResponse {
  user: AuthUser
}

export interface GoogleOAuthUrlData extends GoogleOAuthUrlResponse {
  state: string
}

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await http.post<RegisterResponse>('/auth/register', payload, { skipAuth: true })
  return data
}

export async function loginPassword(payload: LoginPasswordRequest): Promise<AuthResponse | TwoFactorRequired> {
  const { data } = await http.post<AuthResponse | TwoFactorRequired>('/auth/login', payload, {
    skipAuth: true
  })
  return data
}

export async function login2FA(payload: Login2FARequest): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', payload, { skipAuth: true })
  return data
}

export async function verifyGoogle2FA(pendingToken: string, code: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/2fa/verify', { pendingToken, code }, { skipAuth: true })
  return data
}

// RT là HTTP-only cookie — BE tự đọc, không cần gửi body
export async function logout(): Promise<void> {
  await http.post('/auth/logout', undefined, { skipAuth: true })
}

export async function refreshToken(): Promise<RefreshResponse> {
  const { data } = await http.post<RefreshResponse>('/auth/refresh-token', undefined, {
    skipAuth: true
  })
  return data
}

export async function getGoogleAuthUrl(): Promise<GoogleOAuthUrlData> {
  const { data } = await http.get<GoogleOAuthUrlData>('/auth/google', { skipAuth: true })
  return data
}

export async function googleCallback(payload: GoogleCallbackRequest): Promise<AuthResponse | TwoFactorRequired> {
  const { data } = await http.post<AuthResponse | TwoFactorRequired>('/auth/google/callback', payload, {
    skipAuth: true
  })
  return data
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await http.post('/auth/forgot-password', payload, { skipAuth: true })
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await http.post('/auth/reset-password', payload, { skipAuth: true })
}

export async function verifyEmail(payload: VerifyEmailRequest): Promise<void> {
  await http.post('/auth/verify-email', payload, { skipAuth: true })
}

export async function setup2FA(): Promise<TwoFactorSetup> {
  const { data } = await http.get<TwoFactorSetup>('/auth/2fa/setup')
  return data
}

export async function confirm2FA(payload: Confirm2FARequest): Promise<void> {
  await http.post('/auth/2fa/setup/confirm', payload)
}

export async function disable2FA(payload: Disable2FARequest): Promise<void> {
  await http.delete('/auth/2fa', { data: payload })
}

export const authService = {
  register,
  loginPassword,
  login2FA,
  verifyGoogle2FA,
  logout,
  refreshToken,
  getGoogleAuthUrl,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  setup2FA,
  confirm2FA,
  disable2FA
}
