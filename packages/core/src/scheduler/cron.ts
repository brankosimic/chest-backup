import type { CronCallback } from "../types/scheduler"
import { CronExpressionParser } from "cron-parser"
import { logger } from "../utils/logger"

class Scheduler {
  private expression: string
  private callback: CronCallback
  private running = false
  private active = false
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(expression: string, callback: CronCallback) {
    this.expression = expression
    this.callback = callback
  }

  start(): void {
    if (this.active) return
    this.active = true
    this.scheduleNext()
    logger.info({ expression: this.expression }, "scheduler started")
  }

  stop(): void {
    this.active = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    logger.info("scheduler stopped")
  }

  private scheduleNext(): void {
    if (!this.active) return

    try {
      const interval = CronExpressionParser.parse(this.expression)
      const next = interval.next().getTime()
      const delay = Math.max(0, next - Date.now())

      this.timeoutId = setTimeout(() => {
        if (!this.active) return

        if (this.running) {
          logger.warn("previous backup still running, skipping scheduled run")
          this.scheduleNext()
          return
        }

        this.running = true
        void (async () => {
          try {
            await this.callback()
          } catch (err) {
            logger.error({ err }, "scheduled backup failed")
          } finally {
            this.running = false
            this.scheduleNext()
          }
        })()
      }, delay)
    } catch (err) {
      logger.error({ err }, "failed to parse cron expression")
    }
  }
}

export { Scheduler }
