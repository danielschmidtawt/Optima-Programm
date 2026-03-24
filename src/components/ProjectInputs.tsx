import type { Eingaben } from '../calc'

interface Props {
  eingaben: Eingaben
  update: <K extends keyof Eingaben>(key: K, value: Eingaben[K]) => void
}

function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
      <div className="relative">
        {children}
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all'

export function ProjectInputs({ eingaben, update }: Props) {
  return (
    <section className="mb-6 mt-6">
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Projektdaten</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Projektname / Objektbezeichnung">
            <input
              type="text"
              value={eingaben.projektname}
              onChange={e => update('projektname', e.target.value)}
              placeholder="z.B. MFH Bahnhofstrasse 12"
              className={inputClass}
            />
          </Field>
          <Field label="Bearbeiter">
            <input
              type="text"
              value={eingaben.bearbeiter}
              onChange={e => update('bearbeiter', e.target.value)}
              placeholder="Name"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Rohwasserhärte" unit="°dH">
            <input
              type="number"
              value={eingaben.rohwasserhaerte || ''}
              onChange={e => update('rohwasserhaerte', parseFloat(e.target.value) || 0)}
              className={inputClass + ' pr-12'}
              min={0}
              step={0.5}
            />
          </Field>
          <Field label="Gewünschte Resthärte" unit="°dH">
            <input
              type="number"
              value={eingaben.resthaerte || ''}
              onChange={e => update('resthaerte', parseFloat(e.target.value) || 0)}
              className={inputClass + ' pr-12'}
              min={0}
              step={0.5}
            />
          </Field>
          <Field label="Anzahl Personen">
            <input
              type="number"
              value={eingaben.personen || ''}
              onChange={e => update('personen', parseInt(e.target.value) || 0)}
              className={inputClass}
              min={1}
              step={1}
            />
          </Field>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Resthärte-Empfehlung
            </label>
            <div className="flex h-[42px] items-center rounded-xl border border-brand-100 bg-brand-50/50 px-4 text-sm text-brand-700">
              5–8 °dH empfohlen
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
