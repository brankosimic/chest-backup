import { logger } from "./logger"

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

interface ExecOpts {
  timeout?: number
}

async function exec(command: string, opts?: ExecOpts): Promise<ExecResult> {
  logger.debug({ command }, "executing command")

  const proc = Bun.spawn(command.split(" "), {
    stdout: "pipe",
    stderr: "pipe",
  })

  const timeout = opts?.timeout ?? 300_000

  const timer = setTimeout(() => {
    proc.kill()
  }, timeout)

  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  clearTimeout(timer)

  const exitCode = await proc.exited

  logger.debug({ exitCode, command }, "command completed")

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

export type { ExecResult, ExecOpts }
export { exec }
