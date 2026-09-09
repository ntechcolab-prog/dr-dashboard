import { getCurrentUser } from '@/src/shared/server/auth'
import { getCompanyStateMap } from '@/src/shared/server/db/companyState'
import { DEMO_USER, SessionProvider } from '@/src/shared/client/Session'
import { CompanyStateProvider } from '@/src/shared/client/CompanyState'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // No login required: the mock-data app is a public demo. Signed in, it keeps
  // working exactly as before (company state shared through Neon); signed out,
  // it enters as DEMO_USER with in-memory state only — nothing is persisted,
  // and /api/state answers 401 to the writes, which the store already ignores.
  const user = await getCurrentUser()
  const initial = user ? await getCompanyStateMap(user.company.id) : {}

  return (
    <SessionProvider user={user ?? DEMO_USER}>
      <CompanyStateProvider initial={initial}>{children}</CompanyStateProvider>
    </SessionProvider>
  )
}
