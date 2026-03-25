import type { Ergebnisse } from '../calc'
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

export function ResultsPanel({ ergebnisse: e }: Props) {
  return (
    <section className="mb-6 space-y-6">
      {/* Anlagenvorschlag aus Produktkatalog – ganz oben, prominent */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6 border-2 border-brand-300">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Anlagenvorschlag</h2>
        {e.empfohleneAnlage ? (
          <div>
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 mb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-brand-800">{e.empfohleneAnlage.name}</p>
                  <p className="text-sm text-brand-600 mt-0.5">Art.Nr. {e.empfohleneAnlage.artNr} · {kategorieLabel(e.empfohleneAnlage.kategorie)}</p>
                </div>
                <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
                  Empfohlen
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-brand-500">Harzvolumen</p>
                  <p className="text-sm font-semibold text-brand-800">{e.empfohleneAnlage.harz} Liter</p>
                </div>
                <div>
                  <p className="text-xs text-brand-500">Tank / Durchmesser</p>
                  <p className="text-sm font-semibold text-brand-800">{e.empfohleneAnlage.tank} / {e.empfohleneAnlage.zoll}"</p>
                </div>
                <div>
                  <p className="text-xs text-brand-500">Durchfluss Normal</p>
                  <p className="text-sm font-semibold text-brand-800">{e.empfohleneAnlage.durchflussNormal} l/min</p>
                </div>
                <div>
                  <p className="text-xs text-brand-500">Durchfluss Spitze</p>
                  <p className="text-sm font-semibold text-brand-800">{e.empfohleneAnlage.durchflussSpitze} l/min</p>
                </div>
              </div>
            </div>

            {e.alternativeAnlagen.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Alternativen</p>
                <div className="space-y-2">
                  {e.alternativeAnlagen.map(a => (
                    <div key={a.artNr} className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium text-slate-700">{a.name}</span>
                      <span className="text-slate-400">Art.Nr. {a.artNr}</span>
                      <span className="text-slate-500">{a.harz} l</span>
                      <span className="text-slate-500">{a.durchflussSpitze} l/min Spitze</span>
                    </div>
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

      {/* Harzmenge – Prominent */}
      <div className="card-glass rounded-2xl p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Harzmenge</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Gesamte Harzmenge" value={fmt(e.harzmengeGesamt)} unit="Liter" large accent />
          <StatCard label="Pro Flasche" value={fmt(e.harzmengeProFlasche)} unit="Liter" large />
          <StatCard label="Anzahl Flaschen" value={String(e.anzahlFlaschen)} large />
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
