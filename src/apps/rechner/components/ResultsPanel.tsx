import { useState, useMemo } from 'react'
import type { Ergebnisse, Anlage, AnlagenKategorie } from '../calc'
import { kategorieLabel, kopfgroesse, pruefeFlussProKopf, ampelFuerIntervall, betriebFuerAnlage, druckverlustFuerAnlage, ANLAGEN_KATALOG } from '../calc'
import { EngineeringPanel, PlausiBox } from './EngineeringPanel'

interface Props {
  ergebnisse: Ergebnisse
  override: Anlage | null
  setOverride: (a: Anlage | null) => void
  pdfZeigeSalz: boolean
  pdfZeigeKosten: boolean
}

// Druck-Tabellen-Stile: dezent, technisch (AWT)
const thStyle: React.CSSProperties = { padding: '3pt 6pt', border: '1px solid #cbd5e1', fontWeight: 600, background: '#f1f5f9' }
const tdStyle: React.CSSProperties = { padding: '3pt 6pt', border: '1px solid #cbd5e1' }

const KATEGORIEN_REIHENFOLGE: AnlagenKategorie[] = [
  'einzel_1', 'twin_1', 'parallel_1', 'einzel_1_5', 'parallel_1_5', 'einzel_2', 'parallel_2',
]

function fmt(n: number, decimals = 1): string {
  if (!isFinite(n)) return '–'
  return n.toFixed(decimals)
}

function StatCard({ label, value, unit, large, accent, className = '' }: {
  label: string; value: string; unit?: string; large?: boolean; accent?: boolean; className?: string
}) {
  return (
    <div className={`rounded-xl p-4 transition-colors ${accent ? 'bg-gradient-to-br from-brand-50 to-sky-50/60 border border-brand-200/80' : 'bg-white/60 border border-slate-200/70'} ${className}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`font-bold tracking-tight ${large ? 'text-2xl sm:text-3xl' : 'text-lg'} ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
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
  const labels = { gruen: 'Optimal (≥ 2 Tage)', gelb: 'Knapp (1–2 Tage)', rot: 'Kritisch (< 1 Tag)' }
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full shadow-md ${colors[farbe]}`} />
      <span className="text-sm text-slate-600">{labels[farbe]}</span>
    </span>
  )
}

function anschlussText(anschluss: string, anlage: Anlage): string | null {
  if (!anschluss) return null
  const kopf = kopfgroesse(anlage.kategorie)
  if (anlage.betriebsart === 'parallel') {
    return `Parallelverteiler ${anschluss} (Stammgrösse gemäss bauseitigem Anschluss) im Lieferumfang inklusive, Köpfe 2× ${kopf}.`
  }
  if (anschluss !== kopf) {
    return `Anschluss bauseits: ${anschluss} → Anlage ${kopf}, Reduktion/Anschlussgarnitur bauseits.`
  }
  return `Anschluss bauseits: ${anschluss}.`
}

function AnlageDetailCard({ anlage, istEmpfehlung, onZurueck, anschluss }: {
  anlage: Anlage; istEmpfehlung: boolean; onZurueck?: () => void; anschluss: string
}) {
  const anschlussHinweis = anschlussText(anschluss, anlage)
  return (
    <div className="rounded-xl bg-gradient-to-br from-brand-50 via-sky-50/70 to-white border border-brand-200/80 p-4 mb-3 shadow-sm shadow-brand-100/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-brand-800">{anlage.name}</p>
          <p className="text-sm text-brand-600 mt-0.5">Art.Nr. {anlage.artNr} · {kategorieLabel(anlage.kategorie)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!istEmpfehlung && onZurueck && (
            <button
              onClick={onZurueck}
              className="no-print rounded-full border border-brand-300 bg-white px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
            >
              Zurück zur Empfehlung
            </button>
          )}
          {istEmpfehlung && (
            <span className="no-print rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
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
      {anschlussHinweis && (
        <div className="mt-3 rounded-lg bg-white/60 border border-brand-100 px-3 py-2">
          <p className="text-sm font-medium text-brand-700">{anschlussHinweis}</p>
        </div>
      )}
    </div>
  )
}

export function ResultsPanel({ ergebnisse: e, override, setOverride, pdfZeigeSalz, pdfZeigeKosten }: Props) {
  const [zeigeSortiment, setZeigeSortiment] = useState(false)

  const angezeigte = override ?? e.empfohleneAnlage
  const istEmpfehlung = angezeigte === e.empfohleneAnlage

  // Alle verfügbaren Anlagen ausser der aktuell angezeigten
  const andereAnlagen = e.empfohleneAnlage
    ? [e.empfohleneAnlage, ...e.alternativeAnlagen].filter(a => a !== angezeigte)
    : []

  // Plausi-Check 2: Durchfluss pro Kopf vs. Ventil-Maximum
  const flussCheck = useMemo(() => {
    if (!angezeigte) return null
    return pruefeFlussProKopf(e.volumenstromEnthaerter, angezeigte.betriebsart, angezeigte)
  }, [angezeigte, e.volumenstromEnthaerter])

  // Harzmenge aus gewählter Anlage (oder Fallback auf Berechnung)
  // Duplex: Katalog-Harz ist PRO Flasche → Gesamt = 2×; Parallel: Katalog-Harz ist Gesamt
  const harzGesamt = angezeigte
    ? (angezeigte.betriebsart === 'duplex' ? angezeigte.harz * 2 : angezeigte.harz)
    : e.harzmengeGesamt
  const harzProEinheit = angezeigte?.harzProTank ?? (angezeigte ? angezeigte.harz : e.harzmengeProFlasche)
  const anzFlaschen = angezeigte ? (angezeigte.betriebsart === 'simplex' ? 1 : 2) : e.anzahlFlaschen

  // Betriebsdaten der GEWÄHLTEN Anlage: Intervall (inkl. Zwangsregeneration) + Salz
  const betrieb = useMemo(() => {
    if (!angezeigte) return null
    return betriebFuerAnlage(angezeigte, e.tagesbedarfKapazitaet, e.maxRegenIntervall, e.salzkostenProKg)
  }, [angezeigte, e.tagesbedarfKapazitaet, e.maxRegenIntervall, e.salzkostenProKg])

  const intervallAngezeigt = betrieb
    ? Math.min(betrieb.intervallEffektiv, 999)
    : Math.min(e.regenIntervallProFlasche, e.maxRegenIntervall > 0 ? e.maxRegenIntervall : Infinity)
  const ampelAngezeigt = ampelFuerIntervall(intervallAngezeigt)

  // Salz & Kosten: aus der gewählten Anlage (mit Zwangsregeneration), sonst Fallback
  const salzMonatAnz = betrieb ? betrieb.salzMonat : e.salzverbrauchMonat
  const salzJahrAnz = betrieb ? betrieb.salzJahr : e.salzverbrauchJahr
  const kostenJahrAnz = betrieb ? betrieb.kostenJahr : e.betriebskostenJahr

  return (
    <section className="mb-6 space-y-6">
      {/* ── Druck-Zusammenfassung (nur im Print sichtbar, kundentauglich) ── */}
      <div className="hidden print-only">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '6pt' }}>
          <tbody>
            {angezeigte && (
              <tr>
                <td style={{ ...thStyle, width: '25%' }}>Anlage</td>
                <td colSpan={3} style={{ ...tdStyle, fontWeight: 600 }}>{angezeigte.name} · Art.Nr. {angezeigte.artNr} · {kategorieLabel(angezeigte.kategorie)}</td>
              </tr>
            )}
            <tr>
              <td style={{ ...thStyle, width: '25%' }}>Harzmenge gesamt</td>
              <td style={{ ...tdStyle, width: '25%' }}>{harzGesamt} Liter {anzFlaschen === 2 ? `(${anzFlaschen}× ${harzProEinheit} l)` : ''}</td>
              <td style={{ ...thStyle, width: '25%' }}>Regenerationsintervall</td>
              <td style={{ ...tdStyle, width: '25%' }}>
                ca. {fmt(intervallAngezeigt)} Tage{betrieb?.zwangsregeneration ? ' (Zwangsregeneration, Hygiene)' : ''}
              </td>
            </tr>
            <tr>
              <td style={thStyle}>Spitzenvolumenstrom V1</td>
              <td style={tdStyle}>{fmt(e.spitzenvolumenstrom, 3)} l/s ({e.v1Quelle === 'manuell' ? 'lt. Schema' : 'SVGW W3'})</td>
              {pdfZeigeSalz ? (
                <>
                  <td style={thStyle}>Salzverbrauch/Jahr</td>
                  <td style={tdStyle}>ca. {fmt(salzJahrAnz, 0)} kg{pdfZeigeKosten ? ` (${fmt(kostenJahrAnz, 0)} ${e.waehrung})` : ''}</td>
                </>
              ) : (
                <>
                  <td style={thStyle}>Tagesverbrauch</td>
                  <td style={tdStyle}>ca. {fmt(e.tagesverbrauch, 0)} l/Tag</td>
                </>
              )}
            </tr>
            <tr>
              <td style={thStyle}>Verschneidung</td>
              <td style={tdStyle}>{fmt(e.weichwasserAnteil, 0)}% Weichwasser / {fmt(e.rohwasserAnteil, 0)}% Rohwasser</td>
              <td style={thStyle}>Natrium nach Enthärtung</td>
              <td style={tdStyle}>{fmt(e.natriumNachEnthaertung)} mg/l (Grenzwert 200 mg/l)</td>
            </tr>
            {flussCheck && angezeigte && (
              <tr>
                <td style={thStyle}>Durchfluss pro Kopf ({kopfgroesse(angezeigte.kategorie)})</td>
                <td colSpan={3} style={tdStyle}>{flussCheck.flussProjKopfLMin.toFixed(1)} l/min (Nenndurchfluss {flussCheck.nennProKopfLMin.toFixed(1)} / max. {flussCheck.maxProKopfLMin.toFixed(1)} l/min)</td>
              </tr>
            )}
            {e.anschluss && angezeigte && (
              <tr>
                <td style={thStyle}>Anschluss / Verteiler</td>
                <td colSpan={3} style={tdStyle}>{anschlussText(e.anschluss, angezeigte)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Anlagenvorschlag aus Produktkatalog – ganz oben, prominent */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6 border-2 border-brand-300 ring-4 ring-brand-100/40">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Anlagenvorschlag</h2>
        {angezeigte ? (
          <div>
            <AnlageDetailCard
              anlage={angezeigte}
              istEmpfehlung={istEmpfehlung}
              onZurueck={() => setOverride(null)}
              anschluss={e.anschluss}
            />

            {andereAnlagen.length > 0 && (
              <div className="no-print">
                <p className="text-xs font-medium text-slate-500 mb-2">Alternativen — zum Auswählen klicken</p>
                <div className="space-y-2">
                  {andereAnlagen.map(a => (
                    <button
                      key={a.artNr}
                      onClick={() => setOverride(a === e.empfohleneAnlage ? null : a)}
                      className={`w-full rounded-xl border px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-left transition-all cursor-pointer hover:-translate-y-px hover:shadow-sm ${
                        a === e.empfohleneAnlage
                          ? 'border-brand-200 bg-brand-50/50 hover:bg-brand-50'
                          : 'border-slate-200/70 bg-white/60 hover:border-brand-300 hover:bg-brand-50/30'
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

        {/* Gesamtes Sortiment – manuelle Auswahl aus allen Anlagen (nur Bildschirm) */}
        <div className="no-print mt-4 border-t border-slate-200/70 pt-3">
          <button
            onClick={() => setZeigeSortiment(!zeigeSortiment)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50/50 transition"
          >
            <span>Gesamtes Sortiment {zeigeSortiment ? 'ausblenden' : 'durchsuchen'} · {ANLAGEN_KATALOG.length} Anlagen</span>
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${zeigeSortiment ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {zeigeSortiment && (
            <div className="mt-3 space-y-4">
              {KATEGORIEN_REIHENFOLGE.map(kat => {
                const anlagen = ANLAGEN_KATALOG.filter(a => a.kategorie === kat)
                if (anlagen.length === 0) return null
                return (
                  <div key={kat}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{kategorieLabel(kat)}</p>
                    <div className="space-y-1.5">
                      {anlagen.map(a => {
                        const harzBedarf = a.betriebsart === 'parallel' ? e.harzmengeGesamt : e.harzmengeProFlasche
                        const passt = a.harz >= harzBedarf && a.durchflussSpitze >= e.volumenstromEnthaerter * 60
                        const istAktiv = a === angezeigte
                        return (
                          <button
                            key={a.artNr}
                            onClick={() => setOverride(a === e.empfohleneAnlage ? null : a)}
                            className={`w-full rounded-lg border px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-left transition-all cursor-pointer ${
                              istAktiv
                                ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                                : 'border-slate-200/70 bg-white/50 hover:border-brand-300 hover:bg-brand-50/30'
                            }`}
                          >
                            <span className="font-medium text-slate-700">{a.name}</span>
                            <span className="text-slate-400">Art.Nr. {a.artNr}</span>
                            <span className="text-slate-500">{a.harz} l</span>
                            <span className="text-slate-500">{a.durchflussSpitze} l/min</span>
                            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              istAktiv
                                ? 'bg-brand-500 text-white'
                                : passt
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {istAktiv ? 'Ausgewählt' : passt ? 'Passend' : 'Unterdimensioniert'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Engineering / DEV-Ansicht – Live-Ampeln (nur intern, nicht im Kunden-PDF) */}
      <EngineeringPanel ergebnisse={e} anlage={angezeigte} />

      {/* Plausi-Checks – Anschluss & Durchfluss (nur intern, nicht im Kunden-PDF) */}
      {(e.plausiCheck1 || flussCheck?.warnung || (angezeigte && flussCheck)) && (
        <div className="no-print space-y-3">
          {/* Check 1: Hauptleitung vs. V1 */}
          {e.plausiCheck1 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">{e.plausiCheck1}</p>
            </div>
          )}
          {/* Check 2: Durchfluss pro Kopf */}
          {flussCheck?.warnung && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{flussCheck.warnung}</p>
            </div>
          )}
          {/* Durchfluss pro Kopf – immer anzeigen wenn Anlage gewählt */}
          {angezeigte && flussCheck && (
            <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
              <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">
                Durchfluss pro Kopf
                <span className="text-sm font-normal text-slate-400">
                  ({angezeigte.betriebsart === 'parallel' ? '2× ' : ''}{kopfgroesse(angezeigte.kategorie)} Kopf)
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="VE pro Kopf"
                  value={flussCheck.flussProjKopfLMin.toFixed(1)}
                  unit="l/min"
                  accent={flussCheck.status === 'ok'}
                />
                <StatCard
                  label="Nenndurchfluss/Kopf (Dauer)"
                  value={flussCheck.nennProKopfLMin.toFixed(1)}
                  unit="l/min"
                />
                <StatCard
                  label="Max. Ventil/Kopf (Spitze)"
                  value={flussCheck.maxProKopfLMin.toFixed(1)}
                  unit="l/min"
                />
                <div className="flex items-center rounded-xl p-4 border" style={{
                  backgroundColor: flussCheck.status === 'ueberlast' ? '#fef2f2' : flussCheck.status === 'spitze' ? '#fffbeb' : '#f0fdf4',
                  borderColor: flussCheck.status === 'ueberlast' ? '#fecaca' : flussCheck.status === 'spitze' ? '#fde68a' : '#bbf7d0',
                }}>
                  <p className={`text-sm font-medium ${
                    flussCheck.status === 'ueberlast' ? 'text-red-700'
                    : flussCheck.status === 'spitze' ? 'text-amber-700'
                    : 'text-emerald-700'
                  }`}>
                    {flussCheck.status === 'ueberlast'
                      ? '⚠ Ventil-Maximum überschritten'
                      : flussCheck.status === 'spitze'
                        ? 'Im Spitzenbereich – kurzzeitig zulässig (über Nenndurchfluss)'
                        : 'Im Nennbereich – Dauerbetrieb zulässig'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Harzmenge – aus gewählter Anlage */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Harzmenge</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Gesamte Harzmenge" value={String(harzGesamt)} unit="Liter" large accent />
          <StatCard label={anzFlaschen === 2 ? 'Pro Flasche / Tank' : 'Pro Flasche'} value={String(harzProEinheit)} unit="Liter" large />
          <StatCard label={anzFlaschen === 2 ? 'Anzahl Flaschen / Tanks' : 'Anzahl Flaschen'} value={String(anzFlaschen)} large />
        </div>
      </div>

      {/* Volumenstrom & Gleichzeitigkeit */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Volumenstrom & Gleichzeitigkeit</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={e.v1Quelle === 'manuell' ? 'Spitzenvolumenstrom V1 (manuell, lt. Schema)' : 'Spitzenvolumenstrom V1 (aus Personen, SVGW W3)'}
            value={fmt(e.spitzenvolumenstrom, 3)}
            unit="l/s"
          />
          <StatCard label="Volumenstrom durch Enthärter VE" value={fmt(e.volumenstromEnthaerter, 3)} unit="l/s" />
          <StatCard
            label="Druckverlust Δp (Bett + Ventil)"
            value={fmt(angezeigte && e.volumenstromEnthaerter > 0 ? druckverlustFuerAnlage(angezeigte, e.volumenstromEnthaerter) : e.druckverlust, 2)}
            unit="bar"
          />
        </div>
      </div>

      {/* Regeneration */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Regeneration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label={angezeigte ? 'Regenerationsintervall (gewählte Anlage)' : 'Regenerationsintervall pro Flasche'}
            value={fmt(intervallAngezeigt)}
            unit="Tage"
          />
          <div className="no-print flex items-center rounded-xl bg-white/60 border border-slate-200/70 p-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Bewertung</p>
              <AmpelDot farbe={ampelAngezeigt} />
            </div>
          </div>
        </div>
        {betrieb?.zwangsregeneration && (
          <p className="mt-3 rounded-lg bg-sky-50/70 border border-sky-200/70 px-3 py-2 text-xs text-slate-600">
            Zwangsregeneration nach {fmt(e.maxRegenIntervall, 1)} Tagen (Trinkwasser-Hygiene) – die Kapazität der Anlage
            würde rechnerisch ca. {fmt(Math.min(betrieb.intervallNatuerlich, 999))} Tage reichen.
          </p>
        )}
      </div>

      {/* Betriebsdaten */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Betriebsdaten</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tagesverbrauch gesamt" value={fmt(e.tagesverbrauch, 0)} unit="Liter" />
          <StatCard label="Davon durch Enthärter" value={`${fmt(e.durchEnthaerter, 0)} (${fmt(e.verschneidungProzent, 0)}%)`} unit="Liter" />
          <StatCard
            label="Salzverbrauch"
            value={`${fmt(salzMonatAnz)} / ${fmt(salzJahrAnz, 0)}`}
            unit="kg/Mt / kg/J"
            className={pdfZeigeSalz ? '' : 'no-print'}
          />
          <StatCard
            label="Betriebskosten (Salz)"
            value={fmt(kostenJahrAnz, 0)}
            unit={`${e.waehrung}/Jahr`}
            className={pdfZeigeKosten ? '' : 'no-print'}
          />
        </div>
      </div>

      {/* Sicherheit / Natrium */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Sicherheit</h2>
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
        <h2 className="section-title mb-4 text-lg font-semibold text-slate-800">Verschneidung</h2>
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

      {/* Anlagenempfehlung – Kundentext (druckt) + interne Hinweise (nur Bildschirm) */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="section-title mb-3 text-lg font-semibold text-slate-800">Anlagenempfehlung</h2>
        {(() => {
          const a = angezeigte
          const betriebsart = a?.betriebsart ?? (e.anzahlFlaschen === 1 ? 'simplex' : 'duplex')
          const typText = betriebsart === 'simplex'
            ? 'Simplex-Anlage (1 Harzflasche)'
            : betriebsart === 'duplex'
              ? 'Duplex-Anlage (2 Flaschen, Pendelbetrieb)'
              : 'Parallel-Anlage (2 Tanks, gleichzeitig durchströmt)'
          const name = a ? a.name : null
          const harz = a ? a.harz : e.harzmengeGesamt
          const proTank = a?.harzProTank
          let harzInfo = `${harz} Liter`
          if (proTank != null) harzInfo += ` (2 Tanks × ${proTank} Liter)`
          else if (a ? betriebsart === 'duplex' : e.anzahlFlaschen === 2) harzInfo += a
            ? ` pro Flasche (2 × ${harz} Liter)`
            : ` (2 × ${(harz / 2).toFixed(1)} Liter)`

          const v1Label = e.v1Quelle === 'manuell' ? 'lt. Schema' : 'SVGW W3'

          // Kundentext – erscheint auch im PDF
          const kundenZeilen = [
            `Ausgelegte Konfiguration: ${typText}${name ? ` – ${name}` : ''}.`,
            `Spitzenvolumenstrom V1: ${fmt(e.spitzenvolumenstrom, 3)} l/s (${v1Label}).`,
            `Harzvolumen: ${harzInfo}.`,
            `Regenerationsintervall: ca. ${fmt(intervallAngezeigt)} Tage.`,
          ]
          if (betrieb?.zwangsregeneration) {
            kundenZeilen.push(`Zwangsregeneration alle ${fmt(e.maxRegenIntervall, 1)} Tage gemäss Trinkwasser-Hygienepraxis (SVGW/ÖNORM/DIN 19636-100).`)
          }
          const salzZeile = `Salzverbrauch: ca. ${fmt(salzMonatAnz)} kg/Monat (${fmt(salzJahrAnz, 0)} kg/Jahr).`
          const screenOnlyZeilen: string[] = []
          if (pdfZeigeSalz) kundenZeilen.push(salzZeile)
          else screenOnlyZeilen.push(salzZeile)
          const anschlInfo = a ? anschlussText(e.anschluss, a) : null
          if (anschlInfo) kundenZeilen.push(anschlInfo)

          // Interne Hinweise – nur am Bildschirm
          const interneZeilen: string[] = []
          if (ampelAngezeigt === 'rot') {
            interneZeilen.push('⚠ Kritisch: Regenerationsintervall unter 1 Tag – grössere Anlage oder weniger Personen empfohlen.')
          } else if (ampelAngezeigt === 'gelb') {
            interneZeilen.push('Regenerationsintervall knapp – Anlage prüfen.')
          }
          if (e.plausiCheck1) interneZeilen.push(e.plausiCheck1)
          if (flussCheck?.warnung) interneZeilen.push(flussCheck.warnung)
          if (!istEmpfehlung && a) {
            interneZeilen.push('Manuell ausgewählte Anlage (nicht die berechnete Empfehlung).')
          }

          return (
            <>
              <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-brand-800 font-sans">
                  {kundenZeilen.join('\n')}
                </pre>
                {screenOnlyZeilen.length > 0 && (
                  <pre className="no-print whitespace-pre-wrap text-sm leading-relaxed text-brand-800/70 font-sans">
                    {screenOnlyZeilen.join('\n')} (im PDF ausgeblendet)
                  </pre>
                )}
              </div>
              {interneZeilen.length > 0 && (
                <div className="no-print mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">Interne Hinweise (nicht im PDF)</p>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-amber-800 font-sans">
                    {interneZeilen.join('\n')}
                  </pre>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* Plausibilitätsprüfung (Teil D) – Gesamtstatus der Auslegung (nur intern) */}
      <PlausiBox ergebnisse={e} anlage={angezeigte} />
    </section>
  )
}
