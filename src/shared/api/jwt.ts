// Minimal JWT payload decoder. The server signs and verifies the token; the
// client only needs to read claims (org, features, identity), so this does NOT
// verify the signature — never trust it for authorization decisions.

export function decodeJwt<T>(token: string): T | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
