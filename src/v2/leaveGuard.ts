// One screen at a time can hold unsaved edits (the batch editor). It registers a
// guard here; the sidebar asks the guard before switching screens, so leaving
// with changes opens the editor's "save or discard" dialog instead of losing them.

type Guard = (proceed: () => void) => boolean // true = it took over (dialog shown)

let guard: Guard | null = null

export function setLeaveGuard(g: Guard | null) {
  guard = g
}

export function guardedLeave(proceed: () => void) {
  if (!guard || !guard(proceed)) proceed()
}
