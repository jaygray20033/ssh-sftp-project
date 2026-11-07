import { Router } from 'express'

import { AuthMiddleware, authRateLimiterMiddleware, validateBody } from '@common/middlewares'

import AuthController from './auth.controller'
import {
  LoginBodySchema,
  RegisterBodySchema,
  GoogleCallbackBodySchema,
  VerifyEmailBodySchema,
  ForgotPasswordBodySchema,
  ResetPasswordBodySchema,
  ConfirmTwoFactorBodySchema,
  DisableTwoFactorBodySchema,
  TwoFactorLoginBodySchema
} from './dto'

const router = Router()

router.post('/login', authRateLimiterMiddleware, validateBody(LoginBodySchema), AuthController.login)
router.post('/register', authRateLimiterMiddleware, validateBody(RegisterBodySchema), AuthController.register)
router.post('/logout', AuthMiddleware.authenticateRefreshToken, AuthController.logout)
router.post('/refresh-token', AuthMiddleware.authenticateRefreshToken, AuthController.refreshToken)

router.get('/google', authRateLimiterMiddleware, AuthController.getGoogleRedirectUrl)
router.post(
  '/google/callback',
  authRateLimiterMiddleware,
  validateBody(GoogleCallbackBodySchema),
  AuthController.verifyGoogleCallback
)

router.post(
  '/forgot-password',
  authRateLimiterMiddleware,
  validateBody(ForgotPasswordBodySchema),
  AuthController.forgotPassword
)
router.post(
  '/reset-password',
  authRateLimiterMiddleware,
  validateBody(ResetPasswordBodySchema),
  AuthController.resetPassword
)
router.post('/verify-email', authRateLimiterMiddleware, validateBody(VerifyEmailBodySchema), AuthController.verifyEmail)

router.post(
  '/2fa/verify',
  authRateLimiterMiddleware,
  validateBody(TwoFactorLoginBodySchema),
  AuthController.verifyTwoFactor
)
router.get('/2fa/setup', authRateLimiterMiddleware, AuthMiddleware.authenticate, AuthController.setup2FA)
router.post(
  '/2fa/setup/confirm',
  authRateLimiterMiddleware,
  AuthMiddleware.authenticate,
  validateBody(ConfirmTwoFactorBodySchema),
  AuthController.confirm2FA
)
router.delete(
  '/2fa',
  authRateLimiterMiddleware,
  AuthMiddleware.authenticate,
  validateBody(DisableTwoFactorBodySchema),
  AuthController.disable2FA
)

export default router
