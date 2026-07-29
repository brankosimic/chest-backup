interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

interface ExecOpts {
  timeout?: number
}

export type { ExecResult, ExecOpts }
