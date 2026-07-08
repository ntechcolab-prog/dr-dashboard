import { useState } from 'react'
import SubHeader from '../components/SubHeader'
import { Gear } from '../icons/Icons'
import { SETTINGS_TABS } from '../data/appData'
import ProductionSettingsTab from './settings/ProductionSettingsTab'
import { GeneralSettings, DataExportSettings } from './settings/MiscSettings'

export default function SettingsScreen() {
  const [tab, setTab] = useState('General')

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      <SubHeader Icon={Gear} title="Settings" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-card p-2 shadow-card">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              t === tab ? 'bg-primary text-white' : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'General' ? (
        <GeneralSettings />
      ) : tab === 'Production' ? (
        <ProductionSettingsTab />
      ) : tab === 'Data Export' ? (
        <DataExportSettings />
      ) : (
        <section className="grid place-items-center rounded-xl bg-card p-20 text-center shadow-card">
          <div>
            <p className="text-lg font-semibold text-ink">{tab}</p>
            <p className="mt-1 text-sm text-muted">This settings section isn't built out yet.</p>
          </div>
        </section>
      )}
    </div>
  )
}
