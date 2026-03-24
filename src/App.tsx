import { useState, useMemo, useCallback } from 'react'
import { berechne, type Eingaben, type AnlagenTyp } from './calc'
import { Header } from './components/Header'
import { ProjectInputs } from './components/ProjectInputs'
import { AnlagenTypSelector } from './components/AnlagenTypSelector'
import { AdvancedSettings } from './components/AdvancedSettings'
import { ResultsPanel } from './components/ResultsPanel'
import { UnitConverter } from './components/UnitConverter'
import { PrintButton } from './components/PrintButton'

const DEFAULTS: Eingaben = {
  projektname: '',
  bearbeiter: '',
  rohwasserhaerte: 25,
  resthaerte: 5,
  personen: 4,
  bwLu: 11.76,
  bwAuto: true,
  anlagentyp: 'duplex',
  verbrauchProPerson: 150,
  regenIntervallTage: 3,
  natriumRohwasser: 5,
  salzkosten: 0.60,
  volumenstromApparat: 0.70,
  druckverlustApparat: 1.00,
  bwProPerson: 2.94,
}

export default function App() {
  const [eingaben, setEingaben] = useState<Eingaben>({
    ...DEFAULTS,
    bwLu: DEFAULTS.personen * DEFAULTS.bwProPerson,
  })

  const update = useCallback(<K extends keyof Eingaben>(key: K, value: Eingaben[K]) => {
    setEingaben(prev => {
      const next = { ...prev, [key]: value }
      // Auto-BW bei Personenänderung
      if (key === 'personen' && prev.bwAuto) {
        next.bwLu = (value as number) * prev.bwProPerson
      }
      if (key === 'bwProPerson' && prev.bwAuto) {
        next.bwLu = prev.personen * (value as number)
      }
      if (key === 'bwLu') {
        next.bwAuto = false
      }
      return next
    })
  }, [])

  const resetBw = useCallback(() => {
    setEingaben(prev => ({
      ...prev,
      bwAuto: true,
      bwLu: prev.personen * prev.bwProPerson,
    }))
  }, [])

  const ergebnisse = useMemo(() => berechne(eingaben), [eingaben])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Projekt-Eingaben */}
        <ProjectInputs eingaben={eingaben} update={update} />

        {/* Anlagentyp */}
        <AnlagenTypSelector
          value={eingaben.anlagentyp}
          onChange={(v: AnlagenTyp) => update('anlagentyp', v)}
        />

        {/* BW Override Info */}
        <div className="no-print mb-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 min-w-fit">
                Belastungswerte (BW)
              </label>
              <input
                type="number"
                value={eingaben.bwLu || ''}
                onChange={e => update('bwLu', parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition"
                step="0.1"
              />
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                eingaben.bwAuto
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {eingaben.bwAuto ? 'Auto' : 'Manuell'}
              </span>
              {!eingaben.bwAuto && (
                <button
                  onClick={resetBw}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Erweiterte Einstellungen */}
        <AdvancedSettings eingaben={eingaben} update={update} />

        {/* Ergebnisse */}
        <ResultsPanel eingaben={eingaben} ergebnisse={ergebnisse} />

        {/* Einheitenumrechner */}
        <UnitConverter />

        {/* PDF / Druck */}
        <PrintButton />
      </main>

      {/* Print Header */}
      <div className="print-only hidden fixed top-0 left-0 right-0 bg-white p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{eingaben.projektname || 'pH-Optima Konfiguration'}</h1>
            <p className="text-sm text-slate-500">Bearbeiter: {eingaben.bearbeiter || '–'}</p>
          </div>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('de-CH')}</p>
        </div>
      </div>
    </div>
  )
}
