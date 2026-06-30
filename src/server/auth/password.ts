import { scrypt as _scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(_scrypt)

// Hash format: `<saltHex>:<derivedHex>`. scrypt with a per-password random salt.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const derived = (await scrypt(password, salt, 64)) as Buffer
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== derived.length) return false
  return timingSafeEqual(keyBuf, derived)
}
