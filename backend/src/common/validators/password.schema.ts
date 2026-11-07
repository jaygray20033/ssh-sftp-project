import { z } from 'zod/v4'

export const passwordSchema = z
  .string()
  .min(8)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  )
