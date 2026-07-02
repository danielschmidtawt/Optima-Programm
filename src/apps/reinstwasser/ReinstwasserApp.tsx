import { useState, useMemo, useCallback } from 'react'
import { Header } from '../../shared/Header'
import {
  berechneHarz, berechneNachspeisung,
  HARZ_GROESSEN,
  type HarzEingaben, type NachspeisungEingaben,
} from './calc'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all appearance-none'

function fmt(n: number, decimals = 1): string {
  if (!isFinite(n)) return '–'
  return n.toFixed(decimals)
}

function StatCard({ label, value, unit, large, accent }: {
  label: string; value: string; unit?: string; large?: boolean; accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 transition-colors ${accent ? 'bg-gradient-to-br from-brand-50 to-sky-50/60 border border-brand-200/80' : 'bg-white/60 border border-slate-200/70'}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`font-bold tracking-tight ${large ? 'text-2xl sm:text-3xl' : 'text-lg'} ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </div>
  )
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

const HARZ_DEFAULTS: HarzEingaben = {
  leitwertFrisch: 0,
  mengeFrisch: 0,
  leitwertBestand: 0,
  mengeBestand: 0,
  harzGroesse: 7,
}

const NACH_DEFAULTS: NachspeisungEingaben = {
  leistungKW: 0,
  pufferLiter: 0,
  fbhVorhanden: false,
  inhaltManuell: 0,
  leitwertNachspeisung: 420,
}

export default function ReinstwasserApp() {
  const [harz, setHarz] = useState<HarzEingaben>(HARZ_DEFAULTS)
  const [nach, setNach] = useState<NachspeisungEingaben>(NACH_DEFAULTS)

  const updateHarz = useCallback(<K extends keyof HarzEingaben>(key: K, value: HarzEingaben[K]) => {
    setHarz(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateNach = useCallback(<K extends keyof NachspeisungEingaben>(key: K, value: NachspeisungEingaben[K]) => {
    setNach(prev => ({ ...prev, [key]: value }))
  }, [])

  const harzResult = useMemo(() => berechneHarz(harz), [harz])
  const nachResult = useMemo(() => berechneNachspeisung(nach), [nach])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">

        {/* ── Harz-Kapazität: Eingaben ──────────────────────────── */}
        <section className="mb-6 mt-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Harz-Kapazität</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Frisch */}
              <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50/40 to-white/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">Frischwasser</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Leitwert" unit="µS/cm">
                    <input type="number" value={harz.leitwertFrisch || ''} onChange={e => updateHarz('leitwertFrisch', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-16'} placeholder="0" min={0} />
                  </Field>
                  <Field label="Menge" unit="L">
                    <input type="number" value={harz.mengeFrisch || ''} onChange={e => updateHarz('mengeFrisch', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-10'} placeholder="0" min={0} />
                  </Field>
                </div>
              </div>
              {/* Bestand */}
              <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Bestand</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Leitwert" unit="µS/cm">
                    <input type="number" value={harz.leitwertBestand || ''} onChange={e => updateHarz('leitwertBestand', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-16'} placeholder="0" min={0} />
                  </Field>
                  <Field label="Menge" unit="L">
                    <input type="number" value={harz.mengeBestand || ''} onChange={e => updateHarz('mengeBestand', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-10'} placeholder="0" min={0} />
                  </Field>
                </div>
              </div>
            </div>
            <div className="mt-4 max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Harzgrösse</label>
              <select value={harz.harzGroesse} onChange={e => updateHarz('harzGroesse', parseFloat(e.target.value))} className={selectClass}>
                {HARZ_GROESSEN.map(g => (
                  <option key={g} value={g}>{g} Liter</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Harz-Kapazität: Ergebnisse ───────────────────────── */}
        <section className="mb-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Ergebnis Harz-Kapazität</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Misch-Leitwert" value={fmt(harzResult.mischLeitwert, 0)} unit="µS/cm" />
              <StatCard label="Harzbedarf gesamt" value={fmt(harzResult.bedarfLiterGesamt, 2)} unit="Liter" />
              <StatCard label="Einheiten Bedarf" value={fmt(harzResult.bedarfEinheiten, 0)} unit="Stk." large accent />
            </div>
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-200 to-brand-300" />
          <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500">Nachspeisung & Onlinebehandlung</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-brand-200 to-brand-300" />
        </div>

        {/* ── Nachspeisung: Eingaben ───────────────────────────── */}
        <section className="mb-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Anlagenparameter</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Leistung" unit="kW">
                <input type="number" value={nach.leistungKW || ''} onChange={e => updateNach('leistungKW', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-12'} placeholder="0" min={0} />
              </Field>
              <Field label="Puffer" unit="L">
                <input type="number" value={nach.pufferLiter || ''} onChange={e => updateNach('pufferLiter', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-10'} placeholder="0" min={0} />
              </Field>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">FBH vorhanden?</label>
                <select value={nach.fbhVorhanden ? 'ja' : 'nein'} onChange={e => updateNach('fbhVorhanden', e.target.value === 'ja')} className={selectClass}>
                  <option value="nein">Nein</option>
                  <option value="ja">Ja</option>
                </select>
              </div>
              <Field label="Inhalt manuell" unit="L">
                <input type="number" value={nach.inhaltManuell || ''} onChange={e => updateNach('inhaltManuell', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-10'} placeholder="Automatisch" min={0} />
              </Field>
              <Field label="Leitwert Rohwasser" unit="µS/cm">
                <input type="number" value={nach.leitwertNachspeisung || ''} onChange={e => updateNach('leitwertNachspeisung', parseFloat(e.target.value) || 0)} className={inputClass + ' pr-16'} placeholder="420" min={0} />
              </Field>
            </div>
            {nach.inhaltManuell > 0 && (
              <p className="mt-2 text-xs text-amber-600">Manueller Anlageninhalt aktiv – automatische Berechnung aus kW/Puffer wird ignoriert.</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Gerätekapazitäten sind auf 420 µS/cm bezogen und werden auf den eingegebenen Leitwert umgerechnet.
            </p>
          </div>
        </section>

        {/* ── Nachspeisung: Ergebnisse ─────────────────────────── */}
        <section className="mb-6">
          <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
            <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Ergebnis Nachspeisung</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Anlageninhalt" value={fmt(nachResult.anlageninhalt, 0)} unit="Liter" />
              <StatCard label="Nachspeisung pro Jahr" value={fmt(nachResult.nachspeisungPA, 1)} unit="Liter" />
              <StatCard
                label="Patronen-Reichweite"
                value={isFinite(nachResult.reichweiteJahre) ? fmt(Math.min(nachResult.reichweiteJahre, 99), 1) : '–'}
                unit={isFinite(nachResult.reichweiteJahre) && nachResult.reichweiteJahre > 99 ? '> 99 Jahre' : 'Jahre'}
              />
              <div className="rounded-xl p-4 bg-gradient-to-br from-brand-50 via-sky-50/70 to-white border-2 border-brand-300 shadow-sm shadow-brand-100/50">
                <p className="text-xs font-medium text-brand-500 mb-1">Geräte-Empfehlung</p>
                <p className="text-2xl font-bold text-brand-700 sm:text-3xl tracking-tight">{nachResult.empfohlenerGeraet.name}</p>
                <p className="text-xs text-brand-500 mt-1">
                  Kapazität: {Math.round(nachResult.effektiveKapazitaet).toLocaleString('de-CH')} L/Jahr
                  {nach.leitwertNachspeisung > 0 && nach.leitwertNachspeisung !== 420 && (
                    <> bei {nach.leitwertNachspeisung} µS/cm</>
                  )}
                </p>
              </div>
            </div>
            {nachResult.ueberKapazitaet && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">
                  ⚠ Die jährliche Nachspeisung ({fmt(nachResult.nachspeisungPA, 0)} L) übersteigt die Kapazität des grössten Geräts
                  ({Math.round(nachResult.effektiveKapazitaet).toLocaleString('de-CH')} L/Jahr) – Patrone muss mehrmals pro Jahr
                  gewechselt werden oder eine grössere Lösung ist erforderlich.
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
    </>
  )
}
