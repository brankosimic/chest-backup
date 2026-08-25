const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  const timer = new Promise<T>((resolve) => setTimeout(() => {
    resolve(fallback)
  }, ms))
  return Promise.race([promise, timer])
}

export { withTimeout }
