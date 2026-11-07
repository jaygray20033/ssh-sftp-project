import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import {
  ForgotPasswordBodySchema,
  GoogleCallbackBodySchema,
  LoginBodySchema,
  LoginBodyExample,
  LoginBodyTwoFactorExample,
  RegisterBodySchema,
  ResetPasswordBodySchema,
  VerifyEmailBodySchema,
  ConfirmTwoFactorBodySchema,
  DisableTwoFactorBodySchema
} from '@modules/auth/dto'

import {
  validationErrorResponse,
  successWrapper,
  jsonBody,
  unauthorizedResponse,
  conflictResponse,
  rateLimitResponse,
  badRequestResponse,
  TokenPairSchema,
  AuthUserSchema,
  AuthResponseSchema,
  forbiddenResponse,
  notFoundResponse
} from './shared'

const TwoFactorRequiredSchema = registry.register(
  'TwoFactorRequired',
  z.object({
    requiresTwoFactor: z.literal(true),
    pendingToken: z.string().meta({ example: 'a3f8d2c1e4b57f9a...' })
  })
)

const TwoFactorSetupSchema = registry.register(
  'TwoFactorSetup',
  z.object({
    otpauthUrl: z
      .string()
      .meta({ example: 'otpauth://totp/AppName:user@example.com?secret=BASE32SECRET&issuer=AppName' }),
    setUpToken: z.string().meta({ example: 'a3f8d2c1e4b57f9a...' })
  })
)

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: jsonBody(RegisterBodySchema),
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.object({ user: AuthUserSchema }), '/auth/register', 201, 'Registration successful')
        }
      }
    },
    409: conflictResponse('Email or username already exists'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  description: `Single login endpoint for both password-only and 2FA accounts.

**Step 1 — Password login**: send \`{ email, password }\`. If the account has no 2FA, tokens are returned immediately.

If 2FA is enabled, returns \`{ requiresTwoFactor: true, pendingToken }\` instead.

**Step 2 — 2FA completion**: send \`{ email, password, pendingToken, code }\`.

Only \`pendingToken\` and \`code\` are verified — the password is not re-checked (it was already verified in step 1).

The \`pendingToken\` expires in 5 minutes.`,
  request: jsonBody(LoginBodySchema, {
    'password-only': {
      summary: 'No 2FA — email & password',
      value: LoginBodyExample
    },
    'with-2fa': {
      summary: '2FA completion — include pendingToken & code',
      value: LoginBodyTwoFactorExample
    }
  }),
  responses: {
    200: {
      description: 'Login successful **or** 2FA required',
      content: {
        'application/json': {
          schema: z.union([
            successWrapper(AuthResponseSchema, '/auth/login', 200, 'Login successful'),
            successWrapper(TwoFactorRequiredSchema, '/auth/login', 200, 'Two-factor authentication required')
          ])
        }
      }
    },
    400: badRequestResponse('Invalid 2FA code'),
    401: unauthorizedResponse('Invalid credentials or expired 2FA session'),
    404: notFoundResponse('User not found'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Logout — invalidate refresh token',
  description: 'Reads the refresh token from the `rt` httpOnly cookie. No request body required.',
  security: [{ refreshTokenAuth: [] }],
  responses: {
    200: {
      description: 'Logged out successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/logout', 200, 'Logout successful')
        }
      }
    },
    401: unauthorizedResponse('Invalid or expired refresh token')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh-token',
  tags: ['Auth'],
  summary: 'Issue new access token from refresh token',
  description: `Reads the refresh token from the \`rt\` httpOnly cookie.

Returns a new access token in the response body and rotates the refresh token cookie. No request body required.`,
  security: [{ refreshTokenAuth: [] }],
  responses: {
    200: {
      description: 'New token pair issued',
      content: {
        'application/json': {
          schema: successWrapper(TokenPairSchema, '/auth/refresh-token', 200, 'Token refreshed successfully')
        }
      }
    },
    401: unauthorizedResponse('Invalid or expired refresh token'),
    404: notFoundResponse('User not found')
  }
})

registry.registerPath({
  method: 'get',
  path: '/auth/google',
  tags: ['Auth - Google OAuth'],
  summary: 'Generate Google OAuth redirect URL',
  responses: {
    200: {
      description: 'Google OAuth URL generated successfully',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({
              url: z.url().meta({ example: 'https://accounts.google.com/o/oauth2/v2/auth?...' }),
              state: z.string().meta({ example: 'random-csrf-token' })
            }),
            '/auth/google',
            200,
            'Google OAuth URL generated successfully'
          )
        }
      }
    },
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/google/callback',
  tags: ['Auth - Google OAuth'],
  summary: 'Exchange Google OAuth code for tokens',
  description: `Called by the frontend after Google redirects to the FE callback page with \`code\` and \`state\` query params.

**Flow:**
1. FE calls \`GET /auth/google\` to get the auth URL

2. User is redirected to Google and approves access

3. Google redirects to the **frontend** callback page with \`?code=...&state=...\`

4. FE extracts \`code\` and \`state\` from the URL, then POSTs them here

5. Server exchanges the code for tokens and returns \`accessToken\` + \`user\`

If the account has 2FA enabled, returns \`{ requiresTwoFactor: true, pendingToken }\` instead.

Complete login via \`POST /auth/2fa/verify\`.

The \`GOOGLE_CALLBACK_URL\` env var must point to the frontend callback page

and match the Authorized Redirect URI in Google Cloud Console.`,
  request: jsonBody(GoogleCallbackBodySchema),
  responses: {
    200: {
      description: 'Login successful **or** 2FA required',
      content: {
        'application/json': {
          schema: z.union([
            successWrapper(AuthResponseSchema, '/auth/google/callback', 200, 'Google authentication successful'),
            successWrapper(TwoFactorRequiredSchema, '/auth/google/callback', 200, 'Two-factor authentication required')
          ])
        }
      }
    },
    400: badRequestResponse('Google authentication failed'),
    401: unauthorizedResponse('Invalid or expired OAuth state'),
    403: forbiddenResponse('Google email not verified, or email linked to a different Google account'),
    409: conflictResponse('Email already registered with password — link Google from account settings'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/2fa/verify',
  tags: ['Auth - 2FA'],
  summary: 'Complete 2FA login with pending token',
  description: `Completes a pending 2FA login using only \`pendingToken\` + TOTP \`code\`.

  Use this after receiving \`{ requiresTwoFactor: true, pendingToken }\` from \`POST /auth/google/callback\`.

  For password-based 2FA completion, use \`POST /auth/login\` with \`{ email, password, pendingToken, code }\` instead.

The \`pendingToken\` is consumed on success.`,
  request: jsonBody(
    z.object({
      pendingToken: z.string().min(1).meta({ example: 'a3f8d2c1e4b57f9a...' }),
      code: z
        .string()
        .length(6)
        .regex(/^\d{6}$/)
        .meta({ example: '123456' })
    })
  ),
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: successWrapper(AuthResponseSchema, '/auth/2fa/verify', 200, 'Login successful')
        }
      }
    },
    400: badRequestResponse('Invalid 2FA code'),
    401: unauthorizedResponse('Invalid or expired 2FA session'),
    404: notFoundResponse('User not found'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth - Email'],
  summary: 'Request a password reset email',
  description: `Sends a 6-digit OTP code to the provided email address.

**Requirements**: User must have verified their email address and have a password (email/password auth only, not Google OAuth).

Always returns 200 regardless of whether the email exists (privacy protection). Rate limited.`,
  request: jsonBody(ForgotPasswordBodySchema),
  responses: {
    200: {
      description: 'Reset email sent (or silently skipped if email not found / not verified / Google OAuth user)',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/forgot-password', 200, 'Reset link has been sent')
        }
      }
    },
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth - Email'],
  summary: 'Reset password using OTP code from email',
  description:
    "Completes the password reset flow. No authentication required — the 6-digit OTP sent to the user's email is sufficient to verify identity.",
  request: jsonBody(ResetPasswordBodySchema),
  responses: {
    200: {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/reset-password', 200, 'Password reset successful')
        }
      }
    },
    400: badRequestResponse('Invalid, expired or already used OTP token'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/verify-email',
  tags: ['Auth - Email'],
  summary: 'Verify email address using token from email link',
  description:
    "Confirms the user's email address. No authentication required — the secure token sent via email link is sufficient to verify identity.",
  request: jsonBody(VerifyEmailBodySchema),
  responses: {
    200: {
      description: 'Email verified successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/verify-email', 200, 'Email verified successfully')
        }
      }
    },
    400: badRequestResponse('Invalid, expired or already used verification token'),
    422: validationErrorResponse(),
    429: rateLimitResponse()
  }
})

registry.registerPath({
  method: 'get',
  path: '/auth/2fa/setup',
  tags: ['Auth - 2FA'],
  summary: 'Initiate 2FA setup — get otpauth URL',
  description: `Generates a TOTP secret for the authenticated user.

  Returns an \`otpauthUrl\` (\`otpauth://totp/...\`) to render a QR code client-side, and a \`setUpToken\` (valid 5 minutes) required to confirm setup.

Render the QR code from \`otpauthUrl\` using any QR library, then scan it with an authenticator app.

**2FA is not active until confirmed via \`POST /auth/2fa/setup/confirm\`.**`,
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'otpauth URL returned',
      content: {
        'application/json': {
          schema: successWrapper(
            TwoFactorSetupSchema,
            '/auth/2fa/setup',
            200,
            'Scan the otpauthUrl with your authenticator app to generate a QR code'
          )
        }
      }
    },
    401: unauthorizedResponse('Missing or invalid access token'),
    403: forbiddenResponse('Email must be verified before enabling 2FA'),
    404: notFoundResponse('User not found'),
    409: conflictResponse('2FA is already enabled')
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/2fa/setup/confirm',
  tags: ['Auth - 2FA'],
  summary: 'Confirm and activate 2FA',
  description: `Verifies the 6-digit TOTP code from the authenticator app and permanently enables 2FA for the account.

Requires the \`setUpToken\` returned by \`GET /auth/2fa/setup\` (expires in 5 minutes).

The \`setUpToken\` is consumed on success.`,
  security: [{ bearerAuth: [] }],
  request: jsonBody(ConfirmTwoFactorBodySchema),
  responses: {
    200: {
      description: '2FA enabled successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/2fa/setup/confirm', 200, '2FA enabled successfully')
        }
      }
    },
    400: badRequestResponse('Invalid TOTP code'),
    401: unauthorizedResponse('Missing or invalid access token, or setUpToken expired / mismatched'),
    404: notFoundResponse('User not found'),
    409: conflictResponse('2FA is already enabled'),
    422: validationErrorResponse()
  }
})

registry.registerPath({
  method: 'delete',
  path: '/auth/2fa',
  tags: ['Auth - 2FA'],
  summary: 'Disable 2FA',
  description:
    'Disables two-factor authentication for the authenticated account. Requires a valid TOTP code to confirm.',
  security: [{ bearerAuth: [] }],
  request: jsonBody(DisableTwoFactorBodySchema),
  responses: {
    200: {
      description: '2FA disabled successfully',
      content: {
        'application/json': {
          schema: successWrapper(z.null(), '/auth/2fa', 200, '2FA disabled successfully')
        }
      }
    },
    400: badRequestResponse('Invalid TOTP code or 2FA is not enabled'),
    401: unauthorizedResponse('Missing or invalid access token'),
    404: notFoundResponse('User not found'),
    422: validationErrorResponse()
  }
})
