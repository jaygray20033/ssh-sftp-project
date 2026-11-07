import { join, resolve } from 'path'

import pug from 'pug'

import { ResetPasswordParams, VerifyEmailParams } from '@common/types'

const TEMPLATES_DIR = resolve(__dirname, '../../assets/templates/emails')

class TemplateService {
  private renderTemplate(templateName: string, locals: Record<string, unknown>): string {
    const templatePath = join(TEMPLATES_DIR, `${templateName}.pug`)
    return pug.renderFile(templatePath, locals)
  }

  verifyEmail(params: VerifyEmailParams): string {
    return this.renderTemplate('auth/verify-email', params)
  }

  resetPassword(params: ResetPasswordParams): string {
    return this.renderTemplate('auth/reset-password', params)
  }
}

export default TemplateService
