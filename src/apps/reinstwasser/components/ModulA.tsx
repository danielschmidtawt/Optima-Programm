import { HARZ_GROESSEN, HARZ_DATEN, type HarzEingaben, type HarzErgebnisse } from '../calc'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all appearance-none'

function fmt(n: number, decimals = 1): string {
  if (!isFinite(n)) return '–'
  return n.toFixed(decimals)
}

function StatCard({ label, value, unit, accent }: {
  label: string; value: string; unit?: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50 border border-slate-100'}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </div>
  )
}

interface Props {
  eingaben: HarzEingaben
  ergebnisse: HarzErgebnisse
  update: <K extends keyof HarzEingaben>(key: K, value: HarzEingaben[K]) => void
}

export function ModulA({ eingaben, ergebnisse: e, update }: Props) {
  const preisFmt = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'EUR' })

  return (
    <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Modul A: Harz-Kapazität</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Leitwert Frisch</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.leitwertFrisch || ''}
              onChange={ev => update('leitwertFrisch', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-16'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">µS/cm</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Menge Frisch</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.mengeFrisch || ''}
              onChange={ev => update('mengeFrisch', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-10'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Leitwert Bestand</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.leitwertBestand || ''}
              onChange={ev => update('leitwertBestand', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-16'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">µS/cm</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Menge Bestand</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.mengeBestand || ''}
              onChange={ev => update('mengeBestand', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-10'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-600">Harzgrösse</label>
        <select
          value={eingaben.harzGroesse}
          onChange={ev => update('harzGroesse', parseFloat(ev.target.value))}
          className={selectClass}
        >
          {HARZ_GROESSEN.map(g => {
            const d = HARZ_DATEN[String(g)]
            return (
              <option key={g} value={g}>
                {g} Liter — {d.preis} €/Stk
              </option>
            )
          })}
        </select>
      </div>

      {/* Ergebnisse */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Misch-Leitwert" value={fmt(e.mischLeitwert, 0)} unit="µS/cm" />
        <StatCard label="Harzbedarf gesamt" value={fmt(e.bedarfLiterGesamt, 2)} unit="L" />
        <StatCard label="Einheiten Bedarf" value={fmt(e.bedarfEinheiten, 0)} unit="Stk." accent />
        <StatCard label="Gesamtpreis" value={preisFmt.format(e.gesamtpreis)} accent />
      </div>
    </div>
  )
}
