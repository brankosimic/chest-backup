const getEnv = (name: string): string => {
  const value = process.env[name]
  if (value === undefined) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const logLevel = getEnv("LOG_LEVEL")

export { logLevel }
