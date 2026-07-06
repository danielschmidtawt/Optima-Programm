import { useState, useMemo, useCallback, useEffect } from 'react'
import { berechne, type Eingaben, type AnlagenTyp, type Anlage } from './calc'
import { Header } from '../../shared/Header'
import { ProjectInputs } from './components/ProjectInputs'
import { AnlagenTypSelector } from './components/AnlagenTypSelector'
import { AdvancedSettings } from './components/AdvancedSettings'
import { ResultsPanel } from './components/ResultsPanel'
import { UnitConverter } from '../../shared/UnitConverter'
import { PrintButton } from '../../shared/PrintButton'

const DEFAULTS: Eingaben = {
  projektname: '',
  bearbeiter: '',
  rohwasserhaerte: 25,
  resthaerte: 5,
  personen: 4,
  bwLu: 11.76,
  bwAuto: true,
  anlagentyp: 'duplex',
  anschluss: '',
  v1Auto: true,
  v1Manuell: 0,
  verbrauchProPerson: 150,
  regenIntervallTage: 3,
  reserveTage: 1,
  natriumRohwasser: 5,
  salzkosten: 0.60,
  volumenstromApparat: 0.70,
  druckverlustApparat: 1.00,
  bwProPerson: 2.94,
}

export default function RechnerApp() {
  const [eingaben, setEingaben] = useState<Eingaben>({
    ...DEFAULTS,
    bwLu: DEFAULTS.personen * DEFAULTS.bwProPerson,
  })

  const update = useCallback(<K extends keyof Eingaben>(key: K, value: Eingaben[K]) => {
    setEingaben(prev => {
      const next = { ...prev, [key]: value }
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

  // Manuelle Anlagenauswahl (Override der Empfehlung) – zurücksetzen bei neuer Empfehlung
  const [anlagenOverride, setAnlagenOverride] = useState<Anlage | null>(null)
  useEffect(() => setAnlagenOverride(null), [ergebnisse.empfohleneAnlage])
  const angezeigteAnlage = anlagenOverride ?? ergebnisse.empfohleneAnlage
  const effektiverTyp = angezeigteAnlage?.betriebsart ?? eingaben.anlagentyp

  return (
    <>
      {/* Print Header – nur im Druck sichtbar */}
      <div className="print-header print-only hidden">
        <div>
          <h1>{eingaben.projektname || 'Anlagenauslegung Wasserenthärtung'}</h1>
          <p className="print-sub">
            Auslegung Wasserenthärtung · Bearbeiter: {eingaben.bearbeiter || '–'} · Anlagentyp: {
              effektiverTyp === 'simplex' ? 'Simplex' :
              effektiverTyp === 'duplex' ? 'Duplex (Pendel)' : 'Parallel'
            } · Personen: {eingaben.personen} · Rohwasser: {eingaben.rohwasserhaerte} °dH → Resthärte {eingaben.resthaerte} °dH
            {eingaben.anschluss && <> · Anschluss bauseits: {eingaben.anschluss}</>}
          </p>
        </div>
        <div className="print-meta">
          <p className="print-logo">pH-Optima</p>
          <p>{new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        </div>
      </div>

      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <ProjectInputs eingaben={eingaben} update={update} />

        <AnlagenTypSelector
          value={eingaben.anlagentyp}
          onChange={(v: AnlagenTyp) => update('anlagentyp', v)}
          personen={eingaben.personen}
          anlagentypEmpfehlung={ergebnisse.anlagentypEmpfehlung}
        />

        {/* V1 Spitzenvolumenstrom – Auto / Manuell */}
        <div className="no-print mb-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title text-sm font-semibold text-slate-800">Spitzenvolumenstrom V1</h2>
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  onClick={() => update('v1Auto', true)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    eingaben.v1Auto ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Automatisch
                </button>
                <button
                  onClick={() => {
                    if (eingaben.v1Auto) {
                      update('v1Manuell', parseFloat(ergebnisse.v1AutoWert.toFixed(4)))
                    }
                    update('v1Auto', false)
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    !eingaben.v1Auto ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Manuell
                </button>
              </div>
            </div>
            {eingaben.v1Auto ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">BW</label>
                  <input
                    type="number"
                    value={eingaben.bwLu || ''}
                    onChange={e => update('bwLu', parseFloat(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition"
                    step="0.1"
                  />
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    eingaben.bwAuto ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {eingaben.bwAuto ? 'Auto' : 'Manuell'}
                  </span>
                  {!eingaben.bwAuto && (
                    <button onClick={resetBw} className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition">
                      Reset
                    </button>
                  )}
                </div>
                <span className="text-sm text-slate-400">→</span>
                <span className="text-sm font-semibold text-brand-700">V1 = {ergebnisse.v1AutoWert.toFixed(3)} l/s</span>
                <span className="text-xs text-slate-400">(SVGW W3)</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">V1</label>
                <input
                  type="number"
                  value={eingaben.v1Manuell || ''}
                  onChange={e => update('v1Manuell', parseFloat(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  step="0.001"
                />
                <span className="text-xs text-slate-500">l/s</span>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  lt. Schema
                </span>
                <span className="text-xs text-slate-400">(Auto wäre {ergebnisse.v1AutoWert.toFixed(3)} l/s)</span>
              </div>
            )}
          </div>
        </div>

        <AdvancedSettings eingaben={eingaben} update={update} />

        <ResultsPanel ergebnisse={ergebnisse} override={anlagenOverride} setOverride={setAnlagenOverride} />

        <UnitConverter />

        <PrintButton />
      </main>

      {/* Print Footer – nur im Druck sichtbar */}
      <div className="print-footer print-only hidden">
        pH-Optima · Anlagenauslegung Wasserenthärtung · Erstellt am {new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })} · Alle Angaben ohne Gewähr
      </div>
    </>
  )
}
