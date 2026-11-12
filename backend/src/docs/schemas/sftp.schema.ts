import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import {
  DeleteSftpQuerySchema,
  MkdirSftpBodySchema,
  RenameSftpBodySchema,
  SftpPathQuerySchema
} from '@modules/sftp/dto'

import {
  badRequestResponse,
  conflictResponse,
  errorResponse,
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  successWrapper,
  unauthorizedResponse
} from './shared'

const uuidExample = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const security = [{ bearerAuth: [] }]
const hostIdParam = z.object({ id: z.uuid().meta({ example: uuidExample }) })
const base = '/hosts/{id}/sftp'

const sftpErrors = () => ({
  400: badRequestResponse(
    'Invalid path, or HOST_KEY_UNVERIFIED — run a connection test or terminal session first and trust the host key'
  ),
  401: unauthorizedResponse('Missing or invalid access token'),
  403: forbiddenResponse('Permission denied on the SSH server'),
  404: notFoundResponse("Host, path, or (another user's) host not found"),
  502: errorResponse(502, 'SSH/SFTP operation failed', 'Bad Gateway')
})

const SftpEntrySchema = registry.register(
  'SftpEntry',
  z.object({
    name: z.string().meta({ example: 'readme.md' }),
    type: z.enum(['file', 'directory', 'symlink', 'other']).meta({ example: 'file' }),
    size: z.number().meta({ example: 1024 }),
    modifiedAt: z.iso.datetime().meta({ example: '2026-01-15T10:30:00.000Z' }),
    permissions: z.string().meta({ example: '-rw-r--r--' })
  })
)

registry.registerPath({
  method: 'get',
  path: `${base}/list`,
  tags: ['SFTP'],
  summary: 'List a directory (directories first)',
  security,
  request: { params: hostIdParam, query: SftpPathQuerySchema },
  responses: {
    200: {
      description: 'Directory entries',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({
              path: z.string().meta({ example: 'docs' }),
              entries: z.array(SftpEntrySchema)
            }),
            `${base}/list`,
            200,
            'OK'
          )
        }
      }
    },
    ...sftpErrors()
  }
})

registry.registerPath({
  method: 'get',
  path: `${base}/download`,
  tags: ['SFTP'],
  summary: 'Download a file (binary stream)',
  description: 'Streams the file with Content-Disposition: attachment. Requires the host key to be trusted.',
  security,
  request: { params: hostIdParam, query: SftpPathQuerySchema },
  responses: {
    200: {
      description: 'File content',
      content: { 'application/octet-stream': { schema: z.string().meta({ format: 'binary' }) } }
    },
    ...sftpErrors()
  }
})

registry.registerPath({
  method: 'post',
  path: `${base}/upload`,
  tags: ['SFTP'],
  summary: 'Upload a file into a directory',
  description:
    'multipart/form-data with a single `file` field and `path` in the query string (target directory). ' +
    `Max size: SFTP_MAX_UPLOAD_MB (default 100MB). The temp file is deleted after the transfer.`,
  security,
  request: {
    params: hostIdParam,
    query: SftpPathQuerySchema,
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: z.object({ file: z.string().meta({ format: 'binary', example: 'report.pdf' }) })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Uploaded path',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ path: z.string().meta({ example: 'docs/report.pdf' }) }),
            `${base}/upload`,
            200,
            'File uploaded successfully'
          )
        }
      }
    },
    409: conflictResponse('Target file already exists'),
    ...sftpErrors()
  }
})

registry.registerPath({
  method: 'patch',
  path: `${base}/rename`,
  tags: ['SFTP'],
  summary: 'Rename or move an entry',
  security,
  request: { params: hostIdParam, ...jsonBody(RenameSftpBodySchema) },
  responses: {
    200: {
      description: 'Renamed',
      content: {
        'application/json': { schema: successWrapper(z.null(), `${base}/rename`, 200, 'Renamed successfully') }
      }
    },
    ...sftpErrors()
  }
})

registry.registerPath({
  method: 'delete',
  path: base,
  tags: ['SFTP'],
  summary: 'Delete a file or directory',
  description: 'Add `recursive=true` to delete a directory with all of its content.',
  security,
  request: { params: hostIdParam, query: DeleteSftpQuerySchema },
  responses: {
    200: {
      description: 'Deleted',
      content: {
        'application/json': { schema: successWrapper(z.null(), base, 200, 'Deleted successfully') }
      }
    },
    ...sftpErrors()
  }
})

registry.registerPath({
  method: 'post',
  path: `${base}/mkdir`,
  tags: ['SFTP'],
  summary: 'Create a directory',
  security,
  request: { params: hostIdParam, ...jsonBody(MkdirSftpBodySchema) },
  responses: {
    200: {
      description: 'Created directory path',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ path: z.string().meta({ example: 'docs/archive' }) }),
            `${base}/mkdir`,
            200,
            'Directory created'
          )
        }
      }
    },
    409: conflictResponse('Directory already exists'),
    ...sftpErrors()
  }
})
