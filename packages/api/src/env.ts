const getEnv = (name: string, defaultValue?: string): string => {
  const value = process.env[name]
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const host = getEnv("API_HOST", "127.0.0.1")
const port = Number(getEnv("API_PORT", "5199"))

export { host, port }
