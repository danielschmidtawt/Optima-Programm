import { useState } from 'react'
import { dhToFh, dhToMmol, fhToDh, fhToMmol, mmolToDh, mmolToFh } from '../calc'

type Unit = 'dh' | 'fh' | 'mmol'

export function UnitConverter() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<Unit>('dh')
  const [value, setValue] = useState(25)

  const convert = (v: number, from: Unit) => {
    const dh = from === 'dh' ? v : from === 'fh' ? fhToDh(v) : mmolToDh(v)
    const fh = from === 'fh' ? v : from === 'dh' ? dhToFh(v) : mmolToFh(v)
    const mmol = from === 'mmol' ? v : from === 'dh' ? dhToMmol(v) : fhToMmol(v)
    return { dh, fh, mmol }
  }

  const results = convert(value, source)

  const units: { key: Unit; label: string; full: string }[] = [
    { key: 'dh', label: '°dH', full: 'Deutsche Härte' },
    { key: 'fh', label: '°fH', full: 'Französische Härte' },
    { key: 'mmol', label: 'mmol/l', full: 'Millimol pro Liter' },
  ]

  return (
    <section className="no-print mb-6">
      <div className="card-glass rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-800">Einheitenumrechner</h2>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        <div className={`transition-height overflow-hidden ${open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <div className="flex flex-wrap gap-3 mb-4">
              {units.map(u => (
                <button
                  key={u.key}
                  onClick={() => setSource(u.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    source === u.key
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-500 mb-1 block">
                Wert in {units.find(u => u.key === source)?.label}
              </label>
              <input
                type="number"
                value={value || ''}
                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                step={0.1}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {units.map(u => (
                <div key={u.key} className={`rounded-xl p-3 ${u.key === source ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50 border border-slate-100'}`}>
                  <p className="text-xs text-slate-500">{u.full}</p>
                  <p className="text-lg font-bold text-slate-900">
                    {results[u.key].toFixed(2)} <span className="text-sm font-normal text-slate-400">{u.label}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
