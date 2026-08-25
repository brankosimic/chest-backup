const stableId = (obj: Record<string, unknown>): string => {
  const hash = Number(Bun.hash(JSON.stringify(obj)))
  return Math.abs(hash).toString(36)
}

export { stableId }
