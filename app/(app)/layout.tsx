import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/src/server/auth'
import { getCompanyStateMap } from '@/src/server/db/companyState'
import { SessionProvider } from '@/src/client/Session'
import { CompanyStateProvider } from '@/src/client/CompanyState'

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
