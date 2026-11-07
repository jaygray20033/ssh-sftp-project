import axios from 'axios'

import { env } from '@common/config'
import { GOOGLE_AUTH } from '@common/constants'
import { BadRequestError, ForbiddenError } from '@common/errors'
import { GoogleTokenResponse, GoogleUserInfo } from '@common/types/auth.type'

class GoogleService {
  static async getProfileFromAuthCode(code: string) {
    try {
      const tokenResponse = await axios(GOOGLE_AUTH.VERIFY_TOKEN_URL, {
        timeout: 5000,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code'
        }).toString()
      })

      const tokenData = tokenResponse.data as GoogleTokenResponse

      const userResponse = await axios(GOOGLE_AUTH.USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })

      const userInfo = userResponse.data as GoogleUserInfo

      if (!userInfo.verified_email) {
        throw new ForbiddenError('Google account email is not verified.')
      }

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        fullName: userInfo.name,
        avatarUrl: userInfo.picture || null
      }
    } catch (error) {
      if (error instanceof ForbiddenError) throw error
      throw new BadRequestError('Google authentication failed. Please try again.')
    }
  }
}

export default GoogleService
