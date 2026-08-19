// ─── SHARED (v1 + v2) ────────────────────────────────────────────────────────
// The "Production Monitoring" edition flag. With it off, screens hide the
// blocks that depend on continuous monitoring — the Remarks tab and the
// alarm/event/log sections of the Resume tab.
//
// It used to live inside src/v1/screens/settings/MiscSettings.tsx; extracted
// here because v2 reads the flag too and must not depend on a v1 screen.
// The UI that WRITES the flag is still v1-only (Settings → General).
// ─────────────────────────────────────────────────────────────────────────────

import { useLocalStorage } from './useLocalStorage'

/** localStorage key of the general-settings blob — shared with the v1 UI. */
export const GENERAL_SETTINGS_KEY = 'dr-settings-general'

/** Reads the flag. With no dedicated UI to switch it off, it defaults to on. */
export function useProductionMonitoring(): boolean {
  const [s] = useLocalStorage<{ productionMonitoring?: boolean }>(GENERAL_SETTINGS_KEY, {
    productionMonitoring: true,
  })
  return s.productionMonitoring ?? true
}
