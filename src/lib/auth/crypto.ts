import { randomBytes, timingSafeEqual, pbkdf2Sync, createHash } from 'crypto'

const ITERATIONS = 210_000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
  return `pbkdf2$${ITERATIONS}$${salt}$${hash.toString('base64url')}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false

  const [scheme, iterationsRaw, salt, encodedHash] = stored.split('$')
  if (scheme !== 'pbkdf2' || !iterationsRaw || !salt || !encodedHash) {
    return false
  }

  const iterations = Number(iterationsRaw)
  if (!Number.isInteger(iterations) || iterations < 100_000) return false

  const expected = Buffer.from(encodedHash, 'base64url')
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
