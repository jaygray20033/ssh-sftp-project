import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

import env from '@common/config/env'
import { BadRequestError } from '@common/errors'

// Uploads land in a temp dir and are streamed to SFTP, then always deleted.
const uploadDir = path.join(os.tmpdir(), 'shelldeck-upload')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(uploadDir, { recursive: true }, (err) => cb(err, uploadDir))
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`)
})

const upload = multer({
  storage,
  limits: { fileSize: env.SFTP_MAX_UPLOAD_MB * 1024 * 1024 }
})

/** Multer wrapper: single file under field name `file`, size errors → 400. */
export const sftpUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? `File exceeds ${env.SFTP_MAX_UPLOAD_MB}MB` : `Upload failed: ${err.code}`
      return next(new BadRequestError(message))
    }
    if (err) return next(err)
    if (!req.file) return next(new BadRequestError('No file provided (field name: "file")'))
    next()
  })
}
