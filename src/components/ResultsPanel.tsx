import { useState, useEffect } from 'react'
import type { Ergebnisse, Anlage } from '../calc'
import { kategorieLabel } from '../calc'

interface Props {
  ergebnisse: Ergebnisse
}

function fmt(n: number, decimals = 1): string {
  if (!isFinite(n)) return '–'
  return n.toFixed(decimals)
}

function StatCard({ label, value, unit, large, accent }: {
  label: string; value: string; unit?: string; large?: boolean; accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-brand-50 border border-brand-200' : 'bg-slate-50 border border-slate-100'}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`font-bold ${large ? 'text-2xl sm:text-3xl' : 'text-lg'} ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
      </p>
    </div>
  )
}

function AmpelDot({ farbe }: { farbe: 'gruen' | 'gelb' | 'rot' }) {
  const colors = {
    gruen: 'bg-emerald-400 shadow-emerald-200',
    gelb: 'bg-amber-400 shadow-amber-200',
    rot: 'bg-red-400 shadow-red-200',
  }
  const labels = { gruen: 'Optimal (2–4 Tage)', gelb: 'Knapp (1–2 Tage)', rot: 'Kritisch (< 1 Tag)' }
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full shadow-md ${colors[farbe]}`} />
      <span className="text-sm text-slate-600">{labels[farbe]}</span>
    </span>
  )
}

function AnlageDetailCard({ anlage, istEmpfehlung, onZurueck }: {
  anlage: Anlage; istEmpfehlung: boolean; onZurueck?: () => void
}) {
  return (
    <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-brand-800">{anlage.name}</p>
          <p className="text-sm text-brand-600 mt-0.5">Art.Nr. {anlage.artNr} · {kategorieLabel(anlage.kategorie)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!istEmpfehlung && onZurueck && (
            <button
              onClick={onZurueck}
              className="rounded-full border border-brand-300 bg-white px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
            >
              Zurück zur Empfehlung
            </button>
          )}
          {istEmpfehlung && (
            <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
              Empfohlen
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-brand-500">Harzvolumen</p>
          <p className="text-sm font-semibold text-brand-800">
            {anlage.harz} Liter
            {anlage.harzProTank != null && (
              <span className="font-normal text-brand-500"> ({anlage.harzProTank} l/Tank)</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-500">Tank / Durchmesser</p>
          <p className="text-sm font-semibold text-brand-800">
            {anlage.tank} / {anlage.zoll}"
            {anlage.querschnittGesamt != null && (
              <span className="font-normal text-brand-500"> (2×{anlage.querschnitt} dm²)</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-500">Durchfluss Normal</p>
          <p className="text-sm font-semibold text-brand-800">
            {anlage.durchflussNormal} l/min
            {anlage.ventilBegrenztNormal && (
              <span className="ml-1 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">2" begrenzt</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-500">Durchfluss Spitze</p>
          <p className="text-sm font-semibold text-brand-800">
            {anlage.durchflussSpitze} l/min
            {anlage.ventilBegrenztSpitze && (
              <span className="ml-1 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">2" begrenzt</span>
            )}
          </p>
        </div>
      </div>
      {(anlage.ventilBegrenztNormal || anlage.ventilBegrenztSpitze) && (
        <p className="mt-2 text-xs text-amber-600">
          Durchfluss begrenzt durch 2" Verteiler (DN50, max. {anlage.maxAnschlussFluss} l/min bei 2 m/s)
        </p>
      )}
    </div>
  )
}

export function ResultsPanel({ ergebnisse: e }: Props) {
  const [override, setOverride] = useState<Anlage | null>(null)

  // Reset bei neuer Berechnung
  useEffect(() => setOverride(null), [e.empfohleneAnlage])

  const angezeigte = override ?? e.empfohleneAnlage
  const istEmpfehlung = angezeigte === e.empfohleneAnlage

  // Alle verfügbaren Anlagen ausser der aktuell angezeigten
  const andereAnlagen = e.empfohleneAnlage
    ? [e.empfohleneAnlage, ...e.alternativeAnlagen].filter(a => a !== angezeigte)
    : []

  // Harzmenge aus gewählter Anlage (oder Fallback auf Berechnung)
  const harzGesamt = angezeigte ? angezeigte.harz : e.harzmengeGesamt
  const harzProEinheit = angezeigte?.harzProTank ?? (angezeigte ? angezeigte.harz : e.harzmengeProFlasche)
  const anzFlaschen = angezeigte?.harzProTank != null ? 2 : e.anzahlFlaschen

  return (
    <section className="mb-6 space-y-6">
      {/* ── Druck-Zusammenfassung (nur im Print sichtbar) ── */}
      <div className="hidden print-only">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff', width: '25%' }}>Harzmenge gesamt</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', width: '25%' }}>{harzGesamt} Liter {anzFlaschen === 2 ? `(${anzFlaschen}× ${harzProEinheit} l)` : ''}</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff', width: '25%' }}>Regenerationsintervall</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', width: '25%' }}>{fmt(e.regenIntervallProFlasche)} Tage</td>
            </tr>
            <tr>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff' }}>Spitzenvolumenstrom</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1' }}>{fmt(e.spitzenvolumenstrom, 3)} l/s</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff' }}>Salzverbrauch/Jahr</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1' }}>{fmt(e.salzverbrauchJahr, 0)} kg ({fmt(e.betriebskostenJahr, 0)} CHF)</td>
            </tr>
            <tr>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff' }}>Verschneidung</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1' }}>{fmt(e.weichwasserAnteil, 0)}% Weichwasser / {fmt(e.rohwasserAnteil, 0)}% Rohwasser</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f0f9ff' }}>Natrium nach Enthärtung</td>
              <td style={{ padding: '3pt 6pt', border: '1px solid #cbd5e1' }}>{fmt(e.natriumNachEnthaertung)} mg/l {e.natriumWarnung ? '⚠' : '✓'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Anlagenvorschlag aus Produktkatalog – ganz oben, prominent */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6 border-2 border-brand-300">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Anlagenvorschlag</h2>
        {angezeigte ? (
          <div>
            <AnlageDetailCard
              anlage={angezeigte}
              istEmpfehlung={istEmpfehlung}
              onZurueck={() => setOverride(null)}
            />

            {andereAnlagen.length > 0 && (
              <div className="no-print">
                <p className="text-xs font-medium text-slate-500 mb-2">Alternativen — zum Auswählen klicken</p>
                <div className="space-y-2">
                  {andereAnlagen.map(a => (
                    <button
                      key={a.artNr}
                      onClick={() => setOverride(a === e.empfohleneAnlage ? null : a)}
                      className={`w-full rounded-lg border px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-left transition-all cursor-pointer ${
                        a === e.empfohleneAnlage
                          ? 'border-brand-200 bg-brand-50/50 hover:bg-brand-50'
                          : 'border-slate-100 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/30'
                      }`}
                    >
                      <span className="font-medium text-slate-700">{a.name}</span>
                      <span className="text-slate-400">Art.Nr. {a.artNr}</span>
                      <span className="text-slate-500">{a.harz} l</span>
                      <span className="text-slate-500">{a.durchflussSpitze} l/min Spitze</span>
                      {a === e.empfohleneAnlage && (
                        <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-600">Empfehlung</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-medium text-amber-800">
              Keine passende Standardanlage im Katalog gefunden – Sonderlösung erforderlich.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Benötigt: {fmt(e.harzmengeProFlasche)} l Harz/Flasche, {fmt(e.volumenstromEnthaerter * 60, 1)} l/min Spitzendurchfluss.
            </p>
          </div>
        )}
      </div>

      {/* Harzmenge – aus gewählter Anlage */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Harzmenge</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Gesamte Harzmenge" value={String(harzGesamt)} unit="Liter" large accent />
          <StatCard label={anzFlaschen === 2 ? 'Pro Flasche / Tank' : 'Pro Flasche'} value={String(harzProEinheit)} unit="Liter" large />
          <StatCard label={anzFlaschen === 2 ? 'Anzahl Flaschen / Tanks' : 'Anzahl Flaschen'} value={String(anzFlaschen)} large />
        </div>
      </div>

      {/* Volumenstrom & Gleichzeitigkeit */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Volumenstrom & Gleichzeitigkeit</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Spitzenvolumenstrom V1 (SVGW W3)" value={fmt(e.spitzenvolumenstrom, 3)} unit="l/s" />
          <StatCard label="Volumenstrom durch Enthärter VE" value={fmt(e.volumenstromEnthaerter, 3)} unit="l/s" />
          <StatCard label="Druckverlust ΔpE" value={fmt(e.druckverlust, 2)} unit="bar" />
        </div>
      </div>

      {/* Regeneration */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Regeneration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Regenerationsintervall pro Flasche"
            value={fmt(e.regenIntervallProFlasche)}
            unit="Tage"
          />
          <div className="flex items-center rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Bewertung</p>
              <AmpelDot farbe={e.regenAmpel} />
            </div>
          </div>
        </div>
      </div>

      {/* Betriebsdaten */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Betriebsdaten</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tagesverbrauch gesamt" value={fmt(e.tagesverbrauch, 0)} unit="Liter" />
          <StatCard label="Davon durch Enthärter" value={`${fmt(e.durchEnthaerter, 0)} (${fmt(e.verschneidungProzent, 0)}%)`} unit="Liter" />
          <StatCard label="Salzverbrauch" value={`${fmt(e.salzverbrauchMonat)} / ${fmt(e.salzverbrauchJahr, 0)}`} unit="kg/Mt / kg/J" />
          <StatCard label="Betriebskosten (Salz)" value={fmt(e.betriebskostenJahr, 0)} unit="CHF/Jahr" />
        </div>
      </div>

      {/* Sicherheit / Natrium */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Sicherheit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Natriumgehalt nach Enthärtung"
            value={fmt(e.natriumNachEnthaertung)}
            unit="mg/l"
          />
          <div className="flex items-center rounded-xl p-4 border" style={{
            backgroundColor: e.natriumWarnung ? '#fef2f2' : '#f0fdf4',
            borderColor: e.natriumWarnung ? '#fecaca' : '#bbf7d0',
          }}>
            <p className={`text-sm font-medium ${e.natriumWarnung ? 'text-red-700' : 'text-emerald-700'}`}>
              {e.natriumWarnung
                ? '⚠ Grenzwert 200 mg/l überschritten – Massnahmen prüfen!'
                : 'Natriumgehalt innerhalb des Grenzwerts (< 200 mg/l)'}
            </p>
          </div>
        </div>
      </div>

      {/* Verschneidung */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Verschneidung</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-brand-600">Weichwasser {fmt(e.weichwasserAnteil, 0)}%</span>
            <span className="text-slate-500">Rohwasser {fmt(e.rohwasserAnteil, 0)}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
              style={{ width: `${e.weichwasserAnteil}%` }}
            />
          </div>
        </div>
      </div>

      {/* Anlagenempfehlung */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Anlagenempfehlung</h2>
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-brand-800 font-sans">
            {e.empfehlung}
          </pre>
        </div>
      </div>
    </section>
  )
}
