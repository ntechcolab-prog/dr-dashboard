import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/src/shared/server/auth'
import { getCompanyStateMap } from '@/src/shared/server/db/companyState'
import { SessionProvider } from '@/src/shared/client/Session'
import { CompanyStateProvider } from '@/src/shared/client/CompanyState'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const initial = await getCompanyStateMap(user.company.id)

  return (
    <SessionProvider user={user}>
      <CompanyStateProvider initial={initial}>{children}</CompanyStateProvider>
    </SessionProvider>
  )
}
