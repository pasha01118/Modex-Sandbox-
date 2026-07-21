type EventHandler = (payload: any) => void

type AgentEvent =
  | 'task:created'
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'goal:created'
  | 'goal:completed'
  | 'goal:failed'
  | 'agent:status'
  | 'agent:message'
  | 'agent:alert'
  | 'system:health'
  | 'system:update'

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  on(event: AgentEvent | string, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off(event: AgentEvent | string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit(event: AgentEvent | string, payload: any): void {
    for (const h of this.handlers.get(event) ?? []) {
      try { h(payload) } catch { /* swallow handler errors */ }
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const eventBus = new EventBus()
export type { AgentEvent, EventHandler }
