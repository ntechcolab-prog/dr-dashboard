import BatchBookV2 from '@/src/v2/BatchBookV2'
import { batchBookStaticParams } from '@/src/v2/routes'

// One HTML per screen, batch and tab (the tree is in src/v2/routes.ts), so a
// deep link — a MIRA review comment, a shared URL — opens on the right screen.
// Batch ids not in the list (created during a session) render on demand here;
// the MIRA static build (scripts/mira-build.mjs) mounts this same file at the
// root of its export, with root="".
export const generateStaticParams = batchBookStaticParams

export default function BatchBookV2Page() {
  return <BatchBookV2 root="/batch-book-v2" />
}
