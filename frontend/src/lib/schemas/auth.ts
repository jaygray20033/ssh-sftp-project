import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
const PASSWORD_MESSAGE = 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&#)'

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(255, 'Tối đa 255 ký tự'),
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(30, 'Tối đa 30 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ')
})

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Mã OTP phải đủ 6 số')
    .regex(/^\d{6}$/, 'Mã OTP chỉ gồm chữ số')
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(255, 'Tối đa 255 ký tự'),
  username: z
    .string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(30, 'Tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ được dùng chữ cái, số và dấu _')
    .or(z.literal(''))
    .optional()
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').regex(PASSWORD_REGEX, PASSWORD_MESSAGE),
    confirmPassword: z.string()
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type OtpInput = z.infer<typeof otpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
