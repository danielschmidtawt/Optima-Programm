import type { AnlagenTyp } from '../calc'

const typen: { key: AnlagenTyp; label: string; desc: string }[] = [
  {
    key: 'simplex',
    label: 'Simplex',
    desc: '1 Harzflasche, voller Durchfluss. Bei Regeneration kein Weichwasser.',
  },
  {
    key: 'duplex',
    label: 'Duplex (Pendel)',
    desc: '2 Flaschen abwechselnd, unterbrechungsfreie Versorgung.',
  },
  {
    key: 'parallel',
    label: 'Parallel',
    desc: '2 Flaschen gleichzeitig, halber Druckverlust. Bei Regen einer Flasche: andere solo.',
  },
]

interface Props {
  value: AnlagenTyp
  onChange: (v: AnlagenTyp) => void
}

export function AnlagenTypSelector({ value, onChange }: Props) {
  return (
    <section className="no-print mb-6">
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Anlagentyp</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {typen.map(t => (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                value === t.key
                  ? 'border-brand-400 bg-brand-50/60 shadow-md shadow-brand-100'
                  : 'border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full border-2 transition-all ${
                  value === t.key
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-slate-300 bg-white group-hover:border-brand-300'
                }`} />
                <span className={`text-sm font-semibold ${
                  value === t.key ? 'text-brand-700' : 'text-slate-700'
                }`}>
                  {t.label}
                </span>
              </div>
              <p className="mt-1.5 pl-5 text-xs leading-relaxed text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
