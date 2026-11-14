'use strict'

// Sample ShellDeck plugin: POSTs a JSON event whenever a terminal session starts or ends.
// Configure the target with the EXAMPLE_WEBHOOK_URL environment variable of the API process.
// Throwing is safe: ShellDeck catches and logs it, the session keeps running.

const webhookUrl = process.env.EXAMPLE_WEBHOOK_URL || ''
const eventLimit = 50
const events = []

const send = async (event, ctx) => {
  if (!webhookUrl) return

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event, ...ctx }),
    signal: AbortSignal.timeout(5000)
  })

  if (!response.ok) throw new Error(`Webhook responded with ${response.status}`)
}

const remember = (event, ctx) => {
  events.push({ event, ...ctx })
  if (events.length > eventLimit) events.shift()
}

module.exports = {
  onSessionStart: async (ctx) => {
    remember('session:start', ctx)
    await send('session:start', ctx)
  },

  onSessionEnd: async (ctx) => {
    remember('session:end', ctx)
    await send('session:end', ctx)
  },

  // Served at GET /api/v1/plugins/example-webhook/events (requires a logged-in user).
  registerRoutes: (router) => {
    router.get('/events', (_req, res) => {
      res.json({ plugin: 'example-webhook', webhookConfigured: Boolean(webhookUrl), events })
    })
  }
}
