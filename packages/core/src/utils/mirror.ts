const TRAILING_SLASHES = /\/+$/
const LEADING_SLASHES = /^\/+/

const normalizeBase = (base: string): string => base.replace(TRAILING_SLASHES, "")

const cleanRelativePath = (sourcePath: string): string => sourcePath.replace(LEADING_SLASHES, "")

const mirrorPathFor = (base: string, sourcePath: string): string => `${normalizeBase(base)}/${cleanRelativePath(sourcePath)}`

export { normalizeBase, cleanRelativePath, mirrorPathFor }
