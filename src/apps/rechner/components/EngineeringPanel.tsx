// ── Engineering / DEV-Ansicht (Teil B) + Plausibilitätsprüfung (Teil D) ─────
// Rein anzeigende Komponenten – alle Berechnungen kommen aus engineering.ts.

import { useState, useMemo } from 'react'
import type { Ergebnisse, Anlage } from '../calc'
import {
  engineeringChecks,
  pruefeKatalog,
  type EngCheck,
  type EngKontext,
  type Ampel,
} from '../engineering'

const DOT: Record<Ampel, string> = {
  gruen: 'bg-emerald-400 shadow-emerald-200',
  gelb: 'bg-amber-400 shadow-amber-200',
  rot: 'bg-red-500 shadow-red-200',
}
const TEXT: Record<Ampel, string> = {
  gruen: 'text-emerald-700',
  gelb: 'text-amber-700',
  rot: 'text-red-700',
}
const RANG: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 }

function kontextAus(e: Ergebnisse): EngKontext {
  return {
    modus: e.modus,
    veLs: e.volumenstromEnthaerter,
    v1Ls: e.spitzenvolumenstrom,
    anschluss: e.anschluss,
    tagesbedarfKapazitaet: e.tagesbedarfKapazitaet,
    maxRegenIntervall: e.maxRegenIntervall,
    natriumNachEnthaertung: e.natriumNachEnthaertung,
  }
}

function useEngChecks(e: Ergebnisse, anlage: Anlage | null): EngCheck[] {
  return useMemo(() => (anlage ? engineeringChecks(anlage, kontextAus(e)) : []), [anlage, e])
}

// ── Engineering-Panel ────────────────────────────────────────────────────────

export function EngineeringPanel({ ergebnisse: e, anlage }: { ergebnisse: Ergebnisse; anlage: Anlage | null }) {
  const [open, setOpen] = useState(false)
  const [zeigeDatencheck, setZeigeDatencheck] = useState(false)
  const checks = useEngChecks(e, anlage)

  // "Was ändert sich" – Vergleich zur vorherigen Anlagen-Auswahl.
  // Snapshot-Wechsel während des Renderns (dokumentiertes React-Pattern
  // "adjusting state when props change"), kein Effect nötig.
  interface Snap { artNr: string; name: string; ampeln: Record<string, Ampel>; werte: Record<string, string> }
  const [snaps, setSnaps] = useState<{ aktuell: Snap | null; vorher: Snap | null }>({ aktuell: null, vorher: null })
  if (anlage && checks.length > 0 && snaps.aktuell?.artNr !== anlage.artNr) {
    setSnaps({
      aktuell: {
        artNr: anlage.artNr,
        name: anlage.name,
        ampeln: Object.fromEntries(checks.map(c => [c.key, c.ampel])),
        werte: Object.fromEntries(checks.map(c => [c.key, c.wertText])),
      },
      vorher: snaps.aktuell,
    })
  }
  const delta = (() => {
    const vorher = snaps.vorher
    if (!vorher || !anlage || vorher.artNr === anlage.artNr) return null
    const zeilen = checks
      .filter(c => vorher.ampeln[c.key] && vorher.ampeln[c.key] !== c.ampel)
      .map(c => ({
        besser: RANG[c.ampel] < RANG[vorher.ampeln[c.key]],
        text: `${c.label}: ${vorher.werte[c.key]} → ${c.wertText}`,
      }))
    return zeilen.length > 0 ? { titel: `Was ändert sich gegenüber ${vorher.name}:`, zeilen } : null
  })()

  const datencheck = useMemo(() => pruefeKatalog(), [])
  const datenFehler = datencheck.filter(d => d.status === 'fehler')

  const nGruen = checks.filter(c => c.ampel === 'gruen').length
  const nGelb = checks.filter(c => c.ampel === 'gelb').length
  const nRot = checks.filter(c => c.ampel === 'rot').length

  return (
    <div className="no-print card-glass rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-5 sm:p-6 text-left hover:bg-slate-50/50 transition"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="section-title text-lg font-semibold text-slate-800">Engineering / DEV-Ansicht</h2>
          {anlage && (
            <span className="flex items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />{nGruen}</span>
              <span className="flex items-center gap-1 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />{nGelb}</span>
              <span className="flex items-center gap-1 text-red-700"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />{nRot}</span>
            </span>
          )}
        </div>
        <svg className={`h-5 w-5 flex-none text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          {!anlage ? (
            <p className="text-sm text-slate-500">Keine Anlage gewählt – Engineering-Checks benötigen eine konkrete Anlage.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-400">
                Modus: <span className="font-semibold text-slate-600">{e.modus}</span> · Anlage: {anlage.name} ·
                Betriebsfall: {anlage.betriebsart === 'parallel'
                  ? 'beide Flaschen je VE/2; während Regeneration kein Weichwasser'
                  : anlage.betriebsart === 'duplex'
                    ? 'eine Flasche trägt vollen VE, andere regeneriert (durchgehende Versorgung)'
                    : 'eine Flasche trägt vollen VE; keine Versorgung während Regeneration'}
              </p>

              {/* Was-ändert-sich */}
              {delta && (
                <div className="mb-4 rounded-xl border border-brand-200/70 bg-brand-50/50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold text-brand-700">{delta.titel}</p>
                  {delta.zeilen.map((z, i) => (
                    <p key={i} className={`text-xs ${z.besser ? 'text-emerald-700' : 'text-red-700'}`}>
                      {z.besser ? '▲ besser' : '▼ schlechter'} · {z.text}
                    </p>
                  ))}
                </div>
              )}

              {/* Check-Tabelle */}
              <div className="space-y-1.5">
                {checks.map(c => (
                  <div
                    key={c.key}
                    title={c.tooltip}
                    className="rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2"
                  >
                    <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 sm:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)]">
                      <span className={`mt-1 inline-block h-3 w-3 rounded-full shadow-md ${DOT[c.ampel]}`} />
                      <span className="text-sm font-medium text-slate-700">
                        {c.label}
                        <span className="ml-1 cursor-help text-slate-300" title={c.tooltip}>ⓘ</span>
                      </span>
                      <span className={`text-sm font-semibold ${TEXT[c.ampel]}`}>{c.wertText}</span>
                      <span className="text-xs text-slate-400">{c.grenze}</span>
                      <span className="text-xs text-slate-500">{c.reserve}</span>
                    </div>
                    <p className="mt-1 pl-6 text-xs leading-relaxed text-slate-500">
                      <span className={`font-medium ${TEXT[c.ampel]}`}>Einordnung:</span> {c.einordnung}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Grenzwerte zentral in <code>src/apps/rechner/engineering.ts</code> (GRENZWERTE). Tooltip per Mouseover.
              </p>
            </>
          )}

          {/* Datencheck (Teil C) */}
          <div className="mt-4 border-t border-slate-200/70 pt-3">
            <button
              onClick={() => setZeigeDatencheck(!zeigeDatencheck)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50/50 transition"
            >
              <span className="flex items-center gap-2">
                Datencheck Produkttabelle
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  datenFehler.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {datenFehler.length === 0 ? `${datencheck.length} konsistent` : `${datenFehler.length} Widerspruch`}
                </span>
              </span>
              <svg className={`h-4 w-4 transition-transform ${zeigeDatencheck ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>
            {zeigeDatencheck && (
              <div className="mt-2 space-y-1">
                {datenFehler.length === 0 && (
                  <p className="text-xs text-emerald-700">Alle {datencheck.length} Anlagen konsistent (Durchmesser, Betthöhe, Bauart, Namensschema).</p>
                )}
                {datenFehler.map(d => (
                  <div key={d.artNr} className="rounded-lg border border-red-200 bg-red-50/70 px-3 py-2">
                    <p className="text-xs font-semibold text-red-800">{d.name} (Art.Nr. {d.artNr})</p>
                    {d.probleme.map((p, i) => <p key={i} className="text-xs text-red-700">– {p}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Plausibilitätsprüfung (Teil D) ───────────────────────────────────────────

interface PlausiItem {
  status: Ampel
  text: string
  hilfe?: string
}

export function PlausiBox({ ergebnisse: e, anlage }: { ergebnisse: Ergebnisse; anlage: Anlage | null }) {
  const checks = useEngChecks(e, anlage)
  const datencheck = useMemo(() => pruefeKatalog(), [])

  if (!anlage) return null

  const items: PlausiItem[] = []

  // 1) Engineering-Ampeln
  const rote = checks.filter(c => c.ampel === 'rot')
  const gelbe = checks.filter(c => c.ampel === 'gelb' && !c.datenluecke)
  if (rote.length > 0) {
    items.push({
      status: 'rot',
      text: `${rote.length} Parameter im roten Bereich: ${rote.map(c => `${c.label} (${c.wertText})`).join(', ')}.`,
      hilfe: 'Stellschrauben: grössere Flasche wählen, Bauart wechseln (Parallel halbiert v und Δp), Modus prüfen, Verschneidung/Resthärte erhöhen.',
    })
  } else if (gelbe.length > 0) {
    items.push({ status: 'gelb', text: `Alle Parameter grün/gelb – gelb: ${gelbe.map(c => c.label).join(', ')}.` })
  } else {
    items.push({ status: 'gruen', text: 'Alle Engineering-Parameter im grünen Bereich.' })
  }

  // 2) Kapazität deckt Tagesbedarf beim gewählten Intervall
  const harzBedarf = anlage.betriebsart === 'parallel' ? e.harzmengeGesamt : e.harzmengeProFlasche
  if (anlage.harz >= harzBedarf) {
    items.push({ status: 'gruen', text: `Kapazität deckt den Bedarf: ${anlage.harz} l Harz ≥ ${harzBedarf.toFixed(1)} l Auslegungsbedarf.` })
  } else {
    items.push({
      status: 'rot',
      text: `Kapazität zu klein: ${anlage.harz} l Harz < ${harzBedarf.toFixed(1)} l Bedarf beim gewählten Intervall.`,
      hilfe: 'Grössere Flasche wählen oder Regenerationsintervall verkürzen.',
    })
  }

  // 3) Versorgungssicherheit je Bauart
  if (anlage.betriebsart === 'duplex') {
    items.push({ status: 'gruen', text: 'Pendelbetrieb: durchgehende Weichwasser-Versorgung, auch während der Regeneration.' })
  } else {
    items.push({
      status: 'gelb',
      text: `${anlage.betriebsart === 'parallel' ? 'Parallel' : 'Einzel'}: KEIN Weichwasser während der Regeneration.`,
      hilfe: 'Regeneration in Schwachlastzeit legen (z.B. nachts) oder Pendelanlage wählen, wenn 24/7-Versorgung gefordert ist.',
    })
  }

  // 4) Modus-Ziel eingehalten (Filtergeschwindigkeit im Modusfenster)
  const vCheck = checks.find(c => c.key === 'velocity')
  if (vCheck) {
    items.push({
      status: vCheck.ampel,
      text: `Modus-Ziel (${e.modus}): Filtergeschwindigkeit ${vCheck.wertText} – ${vCheck.ampel === 'gruen' ? 'eingehalten' : vCheck.ampel === 'gelb' ? 'im Toleranzbereich' : 'verfehlt'}.`,
      hilfe: vCheck.ampel === 'rot' ? 'Grössere Flasche/Parallelbauart wählen oder Modus «kompakt» bewusst akzeptieren.' : undefined,
    })
  }

  // 5) Datencheck der gewählten Anlage
  const dc = datencheck.find(d => d.artNr === anlage.artNr)
  if (dc && dc.status === 'fehler') {
    items.push({
      status: 'gelb',
      text: `Datencheck: Stammdaten der Anlage widersprüchlich (${dc.probleme[0]}).`,
      hilfe: 'Produkttabelle in calc.ts prüfen/korrigieren – Auslegung basiert auf dem hinterlegten Querschnitt.',
    })
  } else {
    items.push({ status: 'gruen', text: 'Datencheck: Stammdaten der gewählten Anlage konsistent.' })
  }

  const gesamt: Ampel = items.some(i => i.status === 'rot') ? 'rot' : items.some(i => i.status === 'gelb') ? 'gelb' : 'gruen'

  return (
    <div className="no-print card-glass rounded-2xl p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title text-lg font-semibold text-slate-800">Plausibilitätsprüfung</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          gesamt === 'gruen' ? 'bg-emerald-100 text-emerald-700' : gesamt === 'gelb' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>
          Gesamtstatus: {gesamt === 'gruen' ? 'Auslegung plausibel' : gesamt === 'gelb' ? 'Hinweise beachten' : 'Problem – Auslegung prüfen'}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2">
            <span className={`mt-1 inline-block h-3 w-3 flex-none rounded-full shadow-md ${DOT[item.status]}`} />
            <div>
              <p className="text-sm text-slate-700">{item.text}</p>
              {item.hilfe && <p className="mt-0.5 text-xs text-slate-500">→ {item.hilfe}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
