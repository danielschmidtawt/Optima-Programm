import type { NachspeisungEingaben, NachspeisungErgebnisse } from '../calc'

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
  eingaben: NachspeisungEingaben
  ergebnisse: NachspeisungErgebnisse
  update: <K extends keyof NachspeisungEingaben>(key: K, value: NachspeisungEingaben[K]) => void
}

export function ModulB({ eingaben, ergebnisse: e, update }: Props) {
  return (
    <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Modul B: Nachspeisung</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Leistung</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.leistungKW || ''}
              onChange={ev => update('leistungKW', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-12'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kW</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Puffer</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.pufferLiter || ''}
              onChange={ev => update('pufferLiter', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-10'}
              placeholder="0"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">FBH vorhanden?</label>
          <select
            value={eingaben.fbhVorhanden ? 'ja' : 'nein'}
            onChange={ev => update('fbhVorhanden', ev.target.value === 'ja')}
            className={selectClass}
          >
            <option value="nein">Nein</option>
            <option value="ja">Ja</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Inhalt manuell</label>
          <div className="relative">
            <input
              type="number"
              value={eingaben.inhaltManuell || ''}
              onChange={ev => update('inhaltManuell', parseFloat(ev.target.value) || 0)}
              className={inputClass + ' pr-10'}
              placeholder="0 (automatisch)"
              min={0}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">L</span>
          </div>
        </div>
      </div>

      {/* Ergebnisse */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Anlageninhalt" value={fmt(e.anlageninhalt, 0)} unit="L" />
        <StatCard label="Nachspeisung p.a." value={fmt(e.nachspeisungPA, 1)} unit="L" />
        <div className="rounded-xl p-4 bg-brand-50 border-2 border-brand-300">
          <p className="text-xs font-medium text-brand-500 mb-1">Empfehlung</p>
          <p className="text-lg font-bold text-brand-700">{e.empfohlenerGeraet.name}</p>
          <p className="text-xs text-brand-500 mt-0.5">max. {e.empfohlenerGeraet.maxLiter.toLocaleString('de-CH')} L/Jahr</p>
        </div>
      </div>
    </div>
  )
}
