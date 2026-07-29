import pino from "pino"
import { logLevel } from "../env"

const logger = pino({
  level: logLevel,
})

export { logger }
