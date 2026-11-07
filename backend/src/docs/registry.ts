import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Access token — Authorization: Bearer <token>'
})

registry.registerComponent('securitySchemes', 'refreshTokenAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'rt',
  description:
    'Refresh token stored in httpOnly cookie (rt). Set automatically after login — sent by the browser on same-origin requests.'
})
