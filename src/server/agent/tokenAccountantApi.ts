import { Router } from 'express'
import { tokenAccountant } from './tokenAccountant.js'

export const tokenAccountantRouter = Router()

tokenAccountantRouter.get('/summary', (req, res) => {
  const period = (req.query.period as string) || 'today'
  res.json(tokenAccountant.getSummary(period as any))
})

tokenAccountantRouter.get('/daily', (req, res) => {
  const days = parseInt(req.query.days as string) || 7
  res.json(tokenAccountant.getDailyStats(days))
})

tokenAccountantRouter.get('/logs', (req, res) => {
  res.json(tokenAccountant.getLogs({
    provider: req.query.provider as string,
    model: req.query.model as string,
    source: req.query.source as string,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
  }))
})

tokenAccountantRouter.get('/advice', (_req, res) => {
  res.json({ advice: tokenAccountant.getAdvice() })
})

tokenAccountantRouter.get('/budget', (_req, res) => {
  const budget = tokenAccountant.getBudget()
  const alarms = tokenAccountant.getAlarms()
  res.json({ ...budget, alarms })
})

tokenAccountantRouter.post('/budget', (req, res) => {
  const { monthlyUsd } = req.body
  if (typeof monthlyUsd !== 'number' || monthlyUsd < 0) {
    res.status(400).json({ error: 'monthlyUsd must be a non-negative number' })
    return
  }
  res.json(tokenAccountant.setBudget(monthlyUsd))
})

tokenAccountantRouter.post('/alarms', (req, res) => {
  const { thresholds, enabled } = req.body
  const update: any = {}
  if (Array.isArray(thresholds)) {
    update.thresholds = thresholds.filter((t: any) => typeof t === 'number' && t >= 0 && t <= 100)
  }
  if (typeof enabled === 'boolean') update.enabled = enabled
  res.json(tokenAccountant.setAlarms(update))
})

tokenAccountantRouter.post('/log', (req, res) => {
  const { provider, model, inputTokens, outputTokens, source, cached } = req.body
  if (!provider || !model) {
    res.status(400).json({ error: 'provider and model are required' })
    return
  }
  const entry = tokenAccountant.logTokenUsage({
    provider,
    model,
    inputTokens: inputTokens || 0,
    outputTokens: outputTokens || 0,
    source: source || 'manual',
    cached: cached || false,
  })
  res.json(entry)
})

tokenAccountantRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  res.flushHeaders()

  tokenAccountant.addSSEClient(res)
  req.on('close', () => {
    tokenAccountant.removeSSEClient(res)
  })
})

tokenAccountantRouter.post('/cleanup', (req, res) => {
  const keepDays = parseInt(req.body.keepDays as string) || 30
  tokenAccountant.cleanupOldLogs(keepDays)
  res.json({ ok: true })
})
