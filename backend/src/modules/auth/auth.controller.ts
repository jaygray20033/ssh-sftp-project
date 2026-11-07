import { Request, Response } from 'express'

import { env } from '@common/config'
import {
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH
} from '@common/constants'
import { GoogleAuthService } from '@common/services'

import AuthService from './auth.service'
import {
  GoogleCallbackBody,
  LoginBody,
  RegisterBody,
  VerifyEmailBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ConfirmTwoFactorBody,
  DisableTwoFactorBody,
  TwoFactorLoginBody
} from './dto'

class AuthController {
  static async login(req: Request, res: Response) {
    const body = req.body as LoginBody
    const result = await AuthService.login(body)

    if (result.requiresTwoFactor) {
      return res.ok(
        { requiresTwoFactor: true, pendingToken: result.pendingToken },
        { message: 'Two-factor authentication required' }
      )
    }

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
    })

    return res.ok({ accessToken: result.accessToken, user: result.user }, { message: 'Login successful' })
  }

  static async setup2FA(req: Request, res: Response) {
    const userId = req.user!.id
    const result = await AuthService.setup2FA(userId)
    return res.ok(result, {
      message: 'Scan the otpauthUrl with your authenticator app to generate a QR code'
    })
  }

  static async confirm2FA(req: Request, res: Response) {
    const { code, setUpToken } = req.body as ConfirmTwoFactorBody
    await AuthService.confirm2FA(req.user!.id, code, setUpToken)
    return res.ok(null, { message: '2FA enabled successfully' })
  }

  static async disable2FA(req: Request, res: Response) {
    const userId = req.user!.id
    const { code } = req.body as DisableTwoFactorBody
    await AuthService.disable2FA(userId, code)
    return res.ok(null, { message: '2FA disabled successfully' })
  }

  static async register(req: Request, res: Response) {
    const body = req.body as RegisterBody
    const user = await AuthService.register(body)

    return res.created({ user }, { message: 'Registration successful' })
  }

  static async logout(req: Request, res: Response) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    await AuthService.logout(refreshToken)
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: REFRESH_TOKEN_COOKIE_PATH })
    return res.ok(null, { message: 'Logout successful' })
  }

  static async refreshToken(req: Request, res: Response) {
    const userId = req.refreshUserId as string
    const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(oldRefreshToken, userId)

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
    })

    return res.ok({ accessToken }, { message: 'Token refreshed successfully' })
  }

  static async getGoogleRedirectUrl(_req: Request, res: Response) {
    const { url, state } = AuthService.createGoogleAuthUrl()

    return res.ok({ url, state }, { message: 'Google OAuth URL generated successfully' })
  }

  static async verifyGoogleCallback(req: Request, res: Response) {
    const body = req.body as GoogleCallbackBody

    return AuthController.handleGoogleCallback(body, res)
  }

  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.body as VerifyEmailBody
    await AuthService.verifyEmail(token)

    return res.ok(null, { message: 'Email verified successfully' })
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body as ForgotPasswordBody
    await AuthService.forgotPassword(email)

    return res.ok(null, { message: 'Reset link has been sent' })
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body as ResetPasswordBody
    await AuthService.resetPassword(token, password)

    return res.ok(null, { message: 'Password reset successful' })
  }

  static async verifyTwoFactor(req: Request, res: Response) {
    const { pendingToken, code } = req.body as TwoFactorLoginBody
    const { accessToken, refreshToken, user } = await AuthService.verifyTwoFactorLoginToken(pendingToken, code)

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
    })

    return res.ok({ accessToken, user }, { message: 'Login successful' })
  }

  private static async handleGoogleCallback(body: GoogleCallbackBody, res: Response) {
    AuthService.verifyOAuthState(body.state)

    const { email, fullName, googleId, avatarUrl } = await GoogleAuthService.getProfileFromAuthCode(body.code)

    const result = await AuthService.verifyGoogleCallback({ email, fullName, googleId, avatarUrl })

    if (result.requiresTwoFactor) {
      return res.ok(
        { requiresTwoFactor: true, pendingToken: result.pendingToken },
        { message: 'Two-factor authentication required' }
      )
    }

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
    })

    return res.ok(
      { accessToken: result.accessToken, user: result.user },
      { message: 'Google authentication successful' }
    )
  }
}

export default AuthController
