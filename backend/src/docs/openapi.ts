import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'

import { registry } from './registry'
import './extend-zod'

import './schemas/auth.schema'
import './schemas/user.schema'
import './schemas/host.schema'
import './schemas/terminal.schema'

export function buildOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'ShellDeck API',
      version: '1.0.0',
      description: 'ShellDeck REST API: SSH & SFTP in your browser.'
    },
    servers: [{ url: '/api/v1', description: 'API v1' }]
  })
}
