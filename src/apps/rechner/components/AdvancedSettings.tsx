import { useState } from 'react'
import type { Eingaben } from '../calc'

interface Props {
  eingaben: Eingaben
  update: <K extends keyof Eingaben>(key: K, value: Eingaben[K]) => void
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all'

function Row({ label, unit, value, onChange, step = 0.01 }: {
  label: string; unit: string; value: number; onChange: (v: number) => void; step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-slate-600 flex-1">{label}</label>
      <div className="relative w-32">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={inputClass + ' pr-12 text-right'}
          step={step}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  )
}

export function AdvancedSettings({ eingaben, update }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="no-print mb-6">
      <div className="card-glass rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-800">Erweiterte Einstellungen</h2>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        <div
          className={`transition-height overflow-hidden ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3">
              <Row label="Wasserverbrauch pro Person" unit="l/Tag" value={eingaben.verbrauchProPerson} onChange={v => update('verbrauchProPerson', v)} step={10} />
              <Row label="Regenerationsintervall" unit="Tage" value={eingaben.regenIntervallTage} onChange={v => update('regenIntervallTage', v)} step={0.5} />
              <Row label="Natriumgehalt Rohwasser" unit="mg/l" value={eingaben.natriumRohwasser} onChange={v => update('natriumRohwasser', v)} step={1} />
              <Row label="Salzkosten" unit="CHF/kg" value={eingaben.salzkosten} onChange={v => update('salzkosten', v)} step={0.05} />
              <Row label="Volumenstrom Apparat (VA)" unit="l/s" value={eingaben.volumenstromApparat} onChange={v => update('volumenstromApparat', v)} step={0.05} />
              <Row label="Druckverlust Apparat (ΔpA)" unit="bar" value={eingaben.druckverlustApparat} onChange={v => update('druckverlustApparat', v)} step={0.1} />
              <Row label="BW pro Person Richtwert" unit="BW" value={eingaben.bwProPerson} onChange={v => update('bwProPerson', v)} step={0.01} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              EN 14743: max. 4 Tage Regenerationsintervall. CH-Durchschnitt: 150 l/Person/Tag.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
