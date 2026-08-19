import { eq } from 'drizzle-orm'
import { db } from './index'
import { companyState } from './schema'

// Full key -> value map for a company, used to hydrate the client store once
// on entry into the app.
export async function getCompanyStateMap(companyId: string): Promise<Record<string, unknown>> {
  const rows = await db
    .select({ key: companyState.key, value: companyState.value })
    .from(companyState)
    .where(eq(companyState.companyId, companyId))

  const map: Record<string, unknown> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}
