import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

// Lazily created so importing this module (e.g. during `next build` page-data
// collection) never requires DATABASE_URL — it's only needed at request time.
let client: Db | null = null
function getClient(): Db {
  if (client) return client
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Add it to .env.local (Neon connection string).')
  client = drizzle(neon(url), { schema })
  return client
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return getClient()[prop as keyof Db]
  },
})

export { schema }
