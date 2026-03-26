import { useState, useMemo, useCallback } from 'react'
import { Header } from '../../shared/Header'
import { berechneHarz, berechneNachspeisung, type HarzEingaben, type NachspeisungEingaben } from './calc'
import { ModulA } from './components/ModulA'
import { ModulB } from './components/ModulB'

const HARZ_DEFAULTS: HarzEingaben = {
  leitwertFrisch: 0,
  mengeFrisch: 0,
  leitwertBestand: 0,
  mengeBestand: 0,
  harzGroesse: 7,
}

const NACHSPEISUNG_DEFAULTS: NachspeisungEingaben = {
  leistungKW: 0,
  pufferLiter: 0,
  fbhVorhanden: false,
  inhaltManuell: 0,
}

export default function ReinstwasserApp() {
  const [harzEingaben, setHarzEingaben] = useState<HarzEingaben>(HARZ_DEFAULTS)
  const [nachEingaben, setNachEingaben] = useState<NachspeisungEingaben>(NACHSPEISUNG_DEFAULTS)

  const updateHarz = useCallback(<K extends keyof HarzEingaben>(key: K, value: HarzEingaben[K]) => {
    setHarzEingaben(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateNach = useCallback(<K extends keyof NachspeisungEingaben>(key: K, value: NachspeisungEingaben[K]) => {
    setNachEingaben(prev => ({ ...prev, [key]: value }))
  }, [])

  const harzErgebnisse = useMemo(() => berechneHarz(harzEingaben), [harzEingaben])
  const nachErgebnisse = useMemo(() => berechneNachspeisung(nachEingaben), [nachEingaben])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mt-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Reinstwasser & Onlinebehandlung</h2>
          <p className="mt-1 text-sm text-slate-500">Harz-Kapazität berechnen und Nachspeisungsgerät bestimmen</p>
        </div>

        <div className="space-y-6">
          <ModulA eingaben={harzEingaben} ergebnisse={harzErgebnisse} update={updateHarz} />
          <ModulB eingaben={nachEingaben} ergebnisse={nachErgebnisse} update={updateNach} />
        </div>
      </main>
    </>
  )
}
