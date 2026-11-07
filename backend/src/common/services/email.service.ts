import nodemailer from 'nodemailer'
import { Resend } from 'resend'

import { env } from '@common/config'
import { RESET_PASSWORD_EXPIRE_MINUTES, VERIFY_EMAIL_EXPIRE_MINUTES } from '@common/constants'

import TemplateService from './template.service'

type EmailSender = {
  send(to: string, subject: string, html: string): Promise<void>
}

class ResendSender implements EmailSender {
  private resend = new Resend(env.RESEND_API_KEY)

  async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html
    })
    if (error) throw error
  }
}

class NodemailerSender implements EmailSender {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  })

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${env.APP_NAME}" <${env.MAIL_FROM}>`,
      to,
      subject,
      html
    })
  }
}

class EmailService {
  private sender: EmailSender
  private templateService: TemplateService

  constructor() {
    this.sender = env.EMAIL_PROVIDER === 'resend' ? new ResendSender() : new NodemailerSender()
    this.templateService = new TemplateService()
  }

  async sendVerifyEmail(email: string, token: string, name?: string): Promise<void> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`

    const html = this.templateService.verifyEmail({
      name: name || 'bạn',
      verifyUrl,
      expireMinutes: VERIFY_EMAIL_EXPIRE_MINUTES,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM
    })

    return this.sender.send(email, 'Xác thực email của bạn', html)
  }

  async sendResetPasswordEmail(to: string, code: string, name?: string): Promise<void> {
    const html = this.templateService.resetPassword({
      name: name || 'bạn',
      code,
      expireMinutes: RESET_PASSWORD_EXPIRE_MINUTES,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM
    })

    return this.sender.send(to, 'Đặt lại mật khẩu', html)
  }
}

export default EmailService
