import bcrypt from 'bcrypt'

export const comparePassword = (plain: string, hashed: string) => bcrypt.compare(plain, hashed)
