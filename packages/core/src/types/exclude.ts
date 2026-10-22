type PathMatcher = (filePath: string) => boolean

interface SourceFileSummary {
  total: number
  excluded: number
}

export type { PathMatcher, SourceFileSummary }
