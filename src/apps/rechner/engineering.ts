// ── Engineering-Modul: reine Rechen- und Prüffunktionen ─────────────────────
// Kapselt die Auslegungs-Physik in getestete Einzelfunktionen (keine UI-Logik).
// Grundformeln:
//   A[dm²] = π/4 × (d[dm])²
//   v[m/h] = 6 × Q[l/min] / A[dm²]
//   Betthöhe[m] = Harzvolumen[l] / A[dm²] / 10
//
// ALLE AMPEL-GRENZWERTE stehen zentral in GRENZWERTE (unten) – dort anpassen.

import type { Anlage, AnlagenTyp, Modus, AnschlussGroesse } from './calc'
import {
  ANLAGEN_KATALOG,
  ANSCHLUSS_MAX_DURCHFLUSS,
  betriebFuerAnlage,
  pruefeFlussProKopf,
} from './calc'

export type Ampel = 'gruen' | 'gelb' | 'rot'

// 1 °dH·m³ = 0.1783 mol Erdalkali-Ionen (Härtebeladung)
export const MOL_PRO_DH_M3 = 0.1783

// Physikalisches Hartlimit der Filtergeschwindigkeit (unabhängig vom Modus)
export const V_HARTLIMIT_MH = 80

// ── ZENTRALE GRENZWERTE (hier anpassen) ─────────────────────────────────────
export const GRENZWERTE = {
  // Filtergeschwindigkeit Betrieb [m/h] – modusabhängig
  velocity: {
    robust:  { gruen: 40, gelb: 55 },
    kompakt: { gruen: 60, gelb: 75 },
  },
  // Druckverlust [bar] – modusabhängig
  dp: {
    robust:  { gruen: 0.4, gelb: 0.8 },
    kompakt: { gruen: 0.8, gelb: 1.2 },
  },
  // Betthöhe [m]
  bett: { gruenMin: 0.6, gruenMax: 1.8, gelbMin: 0.4, gelbMax: 2.2 },
  // Füllgrad Flasche [%] (Harzvolumen ÷ Innenvolumen)
  fuellgrad: { gruenMin: 40, gruenMax: 55, gelbMin: 25, gelbMax: 65 },
  // Regenerationsintervall [Tage] (Hygiene/Verschleiss)
  intervall: { gruenMin: 1, gruenMax: 4, gelbMin: 1 / 3, gelbMax: 7 },
  // Kapazitätsausnutzung / Beladung [mol/l Harz]
  beladung: { gruenMin: 0.5, gruenMax: 1.2, gelbMin: 0.3, gelbMax: 1.6 },
  // Natrium nach Enthärtung [mg/l]
  natrium: { gruen: 150, gelb: 200 },
  // Ventil-Auslastung [Anteil des Ventil-Maximums]
  ventil: { gruen: 0.8, gelb: 1.0 },
  // Hauptleitung [Anteil des Anschluss-Maximums]
  anschluss: { gruen: 0.8, gelb: 1.0 },
} as const

// ── Reine Rechenfunktionen ───────────────────────────────────────────────────

export function velocityMh(qLmin: number, aDm2: number): number {
  if (aDm2 <= 0) return 0
  return (6 * qLmin) / aDm2
}

export function betthoeheM(harzL: number, aDm2: number): number {
  if (aDm2 <= 0) return 0
  return harzL / aDm2 / 10
}

// Durchfluss pro Flasche im Betrieb [l/min]:
// Einzel/Pendel: volle VE durch eine Flasche; Parallel: VE/2 pro Flasche
export function flussProFlascheLmin(veLs: number, betriebsart: AnlagenTyp): number {
  const ve = veLs * 60
  return betriebsart === 'parallel' ? ve / 2 : ve
}

// Druckverlust [bar] – identische Physik wie in berechne() (Δp ∝ Q²)
export function druckverlustBar(veLs: number, betriebsart: AnlagenTyp, vaRefLs: number, dpRefBar: number): number {
  if (vaRefLs <= 0) return 0
  const qFlasche = betriebsart === 'parallel' ? veLs / 2 : veLs
  return dpRefBar * Math.pow(qFlasche / vaRefLs, 2)
}

// Füllgrad [%] – braucht das Flaschen-Innenvolumen; fehlt es → null (Datenlücke)
export function fuellgradProzent(harzProFlascheL: number, innenvolumenL: number | undefined): number | null {
  if (innenvolumenL == null || innenvolumenL <= 0) return null
  return (harzProFlascheL / innenvolumenL) * 100
}

// Beladung pro Zyklus [mol/l Harz]: aufgenommene Härte je Liter Harz bis zur Regeneration
export function beladungMolProL(tagesbedarfKapazitaet: number, intervallTage: number, harzL: number): number {
  if (harzL <= 0 || !isFinite(intervallTage)) return 0
  return ((tagesbedarfKapazitaet * intervallTage) / harzL) * MOL_PRO_DH_M3
}

// ── Ampel-Funktionen ─────────────────────────────────────────────────────────

export function ampelVelocity(vMh: number, modus: Modus): Ampel {
  const g = GRENZWERTE.velocity[modus]
  if (vMh <= g.gruen) return 'gruen'
  if (vMh <= g.gelb) return 'gelb'
  return 'rot'
}

export function ampelDp(dpBar: number, modus: Modus): Ampel {
  const g = GRENZWERTE.dp[modus]
  if (dpBar <= g.gruen) return 'gruen'
  if (dpBar <= g.gelb) return 'gelb'
  return 'rot'
}

export function ampelBett(hoeheM: number): Ampel {
  const g = GRENZWERTE.bett
  if (hoeheM >= g.gruenMin && hoeheM <= g.gruenMax) return 'gruen'
  if (hoeheM >= g.gelbMin && hoeheM <= g.gelbMax) return 'gelb'
  return 'rot'
}

export function ampelFuellgrad(prozent: number): Ampel {
  const g = GRENZWERTE.fuellgrad
  if (prozent > g.gelbMax) return 'rot'
  if (prozent >= g.gruenMin && prozent <= g.gruenMax) return 'gruen'
  return 'gelb' // 55–65 % oder < 40 % (unter 25 % ebenfalls gelb gemäss Vorgabe)
}

export function ampelIntervallEng(tage: number): Ampel {
  const g = GRENZWERTE.intervall
  if (tage >= g.gruenMin && tage <= g.gruenMax) return 'gruen'
  if ((tage > g.gruenMax && tage <= g.gelbMax) || (tage >= g.gelbMin && tage < g.gruenMin)) return 'gelb'
  return 'rot' // > 7 Tage (Stagnation/Hygiene) oder < 0.33 (> 3×/Tag, Verschleiss)
}

export function ampelBeladung(molProL: number): Ampel {
  const g = GRENZWERTE.beladung
  if (molProL >= g.gruenMin && molProL <= g.gruenMax) return 'gruen'
  if ((molProL > g.gruenMax && molProL <= g.gelbMax) || (molProL >= g.gelbMin && molProL < g.gruenMin)) return 'gelb'
  return 'rot'
}

export function ampelNatrium(mgL: number): Ampel {
  if (mgL < GRENZWERTE.natrium.gruen) return 'gruen'
  if (mgL <= GRENZWERTE.natrium.gelb) return 'gelb'
  return 'rot'
}

export function ampelAuslastung(anteil: number, grenzen: { gruen: number; gelb: number }): Ampel {
  if (anteil <= grenzen.gruen) return 'gruen'
  if (anteil <= grenzen.gelb) return 'gelb'
  return 'rot'
}

// ── Engineering-Checks (Teil B) ──────────────────────────────────────────────

export interface EngKontext {
  modus: Modus
  veLs: number                    // l/s durch Enthärter
  v1Ls: number                    // l/s Gebäudespitze
  anschluss: AnschlussGroesse
  tagesbedarfKapazitaet: number   // °dH·m³/Tag
  maxRegenIntervall: number       // Tage Zwangsregeneration (0 = aus)
  natriumNachEnthaertung: number  // mg/l
  vaRefLs: number                 // Referenz-Apparat für Δp
  dpRefBar: number
}

export interface EngCheck {
  key: string
  label: string
  wertText: string        // formatierter Wert ('Datenlücke' möglich)
  ampel: Ampel
  grenze: string          // Grenzwert-Beschreibung
  reserve: string         // Abstand zur nächsten Grenze
  tooltip: string         // was passiert bei Überschreitung
  datenluecke?: boolean
}

function fmt1(n: number): string { return n.toFixed(1) }
function fmt2(n: number): string { return n.toFixed(2) }

export function engineeringChecks(anlage: Anlage, k: EngKontext): EngCheck[] {
  const checks: EngCheck[] = []
  const A = anlage.querschnitt
  const harzFlasche = anlage.harzProTank ?? anlage.harz
  const vg = GRENZWERTE.velocity[k.modus]
  const dg = GRENZWERTE.dp[k.modus]

  // 1) Filtergeschwindigkeit Betrieb
  const q = flussProFlascheLmin(k.veLs, anlage.betriebsart)
  const v = velocityMh(q, A)
  const vAmpel = ampelVelocity(v, k.modus)
  checks.push({
    key: 'velocity',
    label: 'Filtergeschwindigkeit Betrieb',
    wertText: `${fmt1(v)} m/h`,
    ampel: vAmpel,
    grenze: `grün ≤${vg.gruen} · gelb ≤${vg.gelb} · Hartlimit ${V_HARTLIMIT_MH} m/h`,
    reserve: vAmpel === 'gruen'
      ? `${fmt1(vg.gruen - v)} m/h bis Gelb`
      : vAmpel === 'gelb'
        ? `${fmt1(vg.gelb - v)} m/h bis Rot`
        : `${fmt1(v - vg.gelb)} m/h über Limit${v > V_HARTLIMIT_MH ? ' – HARTLIMIT ÜBERSCHRITTEN' : ''}`,
    tooltip: 'Höhere Geschwindigkeit → mehr Härteleckage und höherer Druckverlust.',
  })

  // 2) Druckverlust
  const dp = druckverlustBar(k.veLs, anlage.betriebsart, k.vaRefLs, k.dpRefBar)
  const dpAmpel = ampelDp(dp, k.modus)
  checks.push({
    key: 'dp',
    label: 'Druckverlust Δp',
    wertText: `${fmt2(dp)} bar`,
    ampel: dpAmpel,
    grenze: `grün ≤${dg.gruen} · gelb ≤${dg.gelb} bar`,
    reserve: dpAmpel === 'gruen'
      ? `${fmt2(dg.gruen - dp)} bar bis Gelb`
      : dpAmpel === 'gelb'
        ? `${fmt2(dg.gelb - dp)} bar bis Rot`
        : `${fmt2(dp - dg.gelb)} bar über Limit`,
    tooltip: 'Zu hoher Δp → Komfortverlust an den Zapfstellen, Pumpenergie.',
  })

  // 3) Betthöhe
  const bett = betthoeheM(harzFlasche, A)
  const bettAmpel = ampelBett(bett)
  const bg = GRENZWERTE.bett
  checks.push({
    key: 'bett',
    label: 'Betthöhe',
    wertText: `${fmt2(bett)} m`,
    ampel: bettAmpel,
    grenze: `grün ${bg.gruenMin}–${bg.gruenMax} · gelb ${bg.gelbMin}–${bg.gelbMax} m`,
    reserve: bettAmpel === 'gruen'
      ? `${fmt2(Math.min(bett - bg.gruenMin, bg.gruenMax - bett))} m Reserve zum Gelbbereich`
      : 'ausserhalb Grünbereich',
    tooltip: 'Zu flach → schlechte Verteilung/Leckage; zu hoch → Druckverlust.',
  })

  // 4) Freibord / Füllgrad – Innenvolumen erforderlich
  const fuellgrad = fuellgradProzent(harzFlasche, anlage.innenvolumenL)
  if (fuellgrad == null) {
    checks.push({
      key: 'fuellgrad',
      label: 'Freibord / Füllgrad',
      wertText: 'Datenlücke',
      ampel: 'gelb',
      grenze: `grün ${GRENZWERTE.fuellgrad.gruenMin}–${GRENZWERTE.fuellgrad.gruenMax} %`,
      reserve: '–',
      tooltip: 'Zu wenig Freibord → Harzaustrag bei Rückspülung.',
      datenluecke: true,
    })
  } else {
    checks.push({
      key: 'fuellgrad',
      label: 'Freibord / Füllgrad',
      wertText: `${fmt1(fuellgrad)} %`,
      ampel: ampelFuellgrad(fuellgrad),
      grenze: `grün ${GRENZWERTE.fuellgrad.gruenMin}–${GRENZWERTE.fuellgrad.gruenMax} · gelb bis ${GRENZWERTE.fuellgrad.gelbMax} %`,
      reserve: `${fmt1(GRENZWERTE.fuellgrad.gelbMax - fuellgrad)} % bis Rot`,
      tooltip: 'Zu wenig Freibord → Harzaustrag bei Rückspülung.',
    })
  }

  // 5) Regenerationsintervall (effektiv, inkl. Zwangsregeneration)
  const betrieb = betriebFuerAnlage(anlage, k.tagesbedarfKapazitaet, k.maxRegenIntervall, 0)
  const intervall = Math.min(betrieb.intervallEffektiv, 999)
  const ig = GRENZWERTE.intervall
  checks.push({
    key: 'intervall',
    label: 'Regenerationsintervall',
    wertText: `${fmt1(intervall)} Tage${betrieb.zwangsregeneration ? ' (Zwang)' : ''}`,
    ampel: ampelIntervallEng(intervall),
    grenze: `grün ${ig.gruenMin}–${ig.gruenMax} · gelb bis ${ig.gelbMax} Tage`,
    reserve: betrieb.zwangsregeneration
      ? `Kapazität würde ${fmt1(Math.min(betrieb.intervallNatuerlich, 999))} Tage reichen`
      : intervall <= ig.gruenMax
        ? `${fmt1(ig.gruenMax - intervall)} Tage bis Gelb`
        : `${fmt1(intervall - ig.gruenMax)} Tage über Grün`,
    tooltip: '> 7 Tage → Stagnation/Hygiene-Risiko; > 3×/Tag → Verschleiss & Salzverbrauch.',
  })

  // 6) Kapazitätsausnutzung / Beladung
  const beladung = beladungMolProL(k.tagesbedarfKapazitaet, betrieb.intervallEffektiv, anlage.harz)
  const lg = GRENZWERTE.beladung
  checks.push({
    key: 'beladung',
    label: 'Beladung pro Zyklus',
    wertText: `${fmt2(beladung)} mol/l`,
    ampel: ampelBeladung(beladung),
    grenze: `grün ${lg.gruenMin}–${lg.gruenMax} · gelb ${lg.gelbMin}–${lg.gelbMax} mol/l`,
    reserve: beladung <= lg.gruenMax
      ? `${fmt2(lg.gruenMax - beladung)} mol/l bis Sättigungsbereich`
      : `${fmt2(beladung - lg.gruenMax)} mol/l über Grün`,
    tooltip: '> 1.6 → nahe Sättigung (Leckage); < 0.3 → Harz wird nicht ausgenutzt (ineffizient).',
  })

  // 7) Natrium
  checks.push({
    key: 'natrium',
    label: 'Natrium nach Enthärtung',
    wertText: `${fmt1(k.natriumNachEnthaertung)} mg/l`,
    ampel: ampelNatrium(k.natriumNachEnthaertung),
    grenze: `grün <${GRENZWERTE.natrium.gruen} · gelb ≤${GRENZWERTE.natrium.gelb} mg/l (Grenzwert)`,
    reserve: `${fmt1(GRENZWERTE.natrium.gelb - k.natriumNachEnthaertung)} mg/l bis Grenzwert`,
    tooltip: 'TBDV/WHO-Grenzwert 200 mg/l – bei Überschreitung Resthärte erhöhen (weniger Verschneidung).',
  })

  // 8) Durchfluss pro Kopf/Ventil
  const fluss = pruefeFlussProKopf(k.veLs, anlage.betriebsart, anlage)
  const ventilAnteil = fluss.maxProKopfLMin > 0 ? fluss.flussProjKopfLMin / fluss.maxProKopfLMin : 0
  checks.push({
    key: 'ventil',
    label: 'Ventil-Auslastung pro Kopf',
    wertText: `${fmt1(ventilAnteil * 100)} % (${fmt1(fluss.flussProjKopfLMin)} von ${fmt1(fluss.maxProKopfLMin)} l/min)`,
    ampel: ampelAuslastung(ventilAnteil, GRENZWERTE.ventil),
    grenze: `grün ≤${GRENZWERTE.ventil.gruen * 100} % · gelb ≤${GRENZWERTE.ventil.gelb * 100} %`,
    reserve: `${fmt1((GRENZWERTE.ventil.gelb - ventilAnteil) * 100)} % bis Ventil-Maximum`,
    tooltip: 'Über dem Ventil-Maximum → Druckverlust steigt stark, Regelverhalten leidet.',
  })

  // 9) Hauptleitung vs. V1 (Plausi-Check 1 als Ampel)
  if (k.anschluss) {
    const max = ANSCHLUSS_MAX_DURCHFLUSS[k.anschluss] ?? 0
    const anteil = max > 0 ? k.v1Ls / max : 0
    checks.push({
      key: 'anschluss',
      label: `Hauptleitung ${k.anschluss} vs. V1`,
      wertText: `${fmt1(anteil * 100)} % (${fmt2(k.v1Ls)} von ${fmt2(max)} l/s)`,
      ampel: ampelAuslastung(anteil, GRENZWERTE.anschluss),
      grenze: `grün ≤${GRENZWERTE.anschluss.gruen * 100} % · gelb ≤${GRENZWERTE.anschluss.gelb * 100} %`,
      reserve: `${fmt2(Math.max(0, max - k.v1Ls))} l/s Reserve in der Hauptleitung`,
      tooltip: 'V1 über der Hauptleitungskapazität → grössere Leitung prüfen (nur Hinweis, nicht blockierend).',
    })
  } else {
    checks.push({
      key: 'anschluss',
      label: 'Hauptleitung vs. V1',
      wertText: 'Datenlücke (kein Anschluss gewählt)',
      ampel: 'gelb',
      grenze: '–',
      reserve: '–',
      tooltip: 'Bauseitigen Anschluss in den Projektdaten wählen, um die Hauptleitung zu prüfen.',
      datenluecke: true,
    })
  }

  return checks
}

// Schlechteste Ampel einer Check-Liste (Datenlücken zählen nicht als rot)
export function schlechtesteAmpel(checks: EngCheck[]): Ampel {
  if (checks.some(c => c.ampel === 'rot')) return 'rot'
  if (checks.some(c => c.ampel === 'gelb')) return 'gelb'
  return 'gruen'
}

// ── Datencheck der Produkttabelle (Teil C) ───────────────────────────────────

// Gültige Standard-Flaschendurchmesser mit Querschnitt A [dm²]
// (7" ergänzt für den 735-Tank der MFH-15-Baureihe; A = π/4·d²)
export const STANDARD_DURCHMESSER: Record<number, number> = {
  7: 2.48, 8: 3.24, 9: 4.11, 10: 5.07, 12: 7.29, 13: 8.56,
  14: 9.93, 16: 12.97, 18: 16.40, 21: 22.30, 24: 29.22,
}

export interface DatencheckEintrag {
  artNr: string
  name: string
  status: 'ok' | 'fehler'
  probleme: string[]
}

function tankDurchmesserAusCode(tank: string): number | null {
  const digits = tank.replace(/[^0-9]/g, ' ').trim().split(/\s+/)[0] ?? ''
  if (digits.length >= 4) return parseInt(digits.slice(0, 2), 10)
  if (digits.length === 3) return parseInt(digits.slice(0, 1), 10)
  return null
}

export function pruefeKatalog(katalog: Anlage[] = ANLAGEN_KATALOG): DatencheckEintrag[] {
  return katalog.map(a => {
    const probleme: string[] = []
    const harzFlasche = a.harzProTank ?? a.harz

    // Durchmesser: Standardgrösse + Querschnitt konsistent (±2.5 %)
    const refA = STANDARD_DURCHMESSER[a.zoll]
    if (refA == null) {
      probleme.push(`Unbekannter Durchmesser ${a.zoll}" (keine Standardgrösse)`)
    } else if (Math.abs(a.querschnitt - refA) / refA > 0.025) {
      probleme.push(`Querschnitt ${a.querschnitt} dm² passt nicht zu ${a.zoll}" (erwartet ~${refA} dm²)`)
    }

    // Tank-Code vs. Durchmesser
    const tankZoll = tankDurchmesserAusCode(a.tank)
    if (tankZoll != null && tankZoll !== a.zoll) {
      probleme.push(`Tank-Code "${a.tank}" (${tankZoll}") widerspricht Durchmesser ${a.zoll}"`)
    }

    // Betthöhe plausibel + hinterlegte harzhoehe konsistent
    const bett = betthoeheM(harzFlasche, a.querschnitt)
    if (bett < 0.4 || bett > 2.2) {
      probleme.push(`Betthöhe ${bett.toFixed(2)} m ausserhalb 0.4–2.2 m`)
    }
    const bettDm = harzFlasche / a.querschnitt
    if (Math.abs(a.harzhoehe - bettDm) > 0.3) {
      probleme.push(`Feld harzhoehe ${a.harzhoehe} dm ≠ berechnet ${bettDm.toFixed(1)} dm`)
    }

    // Geschwindigkeit bei hinterlegtem Spitzendurchfluss ≤ Hartlimit
    const tanks = a.betriebsart === 'parallel' ? 2 : 1
    const vSpitze = velocityMh(a.durchflussSpitze / tanks, a.querschnitt)
    if (vSpitze > V_HARTLIMIT_MH + 0.5) {
      probleme.push(`v bei Spitzendurchfluss ${vSpitze.toFixed(1)} m/h > Hartlimit ${V_HARTLIMIT_MH}`)
    }

    // Bauart-Logik
    if (a.betriebsart === 'parallel') {
      if (a.harzProTank == null) probleme.push('Parallel ohne harzProTank')
      else if (a.harz !== a.harzProTank * 2) probleme.push(`Harz gesamt ${a.harz} ≠ 2 × ${a.harzProTank} pro Tank`)
      if (a.querschnittGesamt != null && Math.abs(a.querschnittGesamt - 2 * a.querschnitt) > 0.05) {
        probleme.push('querschnittGesamt ≠ 2 × Einzelquerschnitt')
      }
    }

    // Namensschema: MFH-Zahl = Harz pro Flasche/Tank
    const m = a.name.match(/MFH (\d+)\//)
    if (m && parseInt(m[1], 10) !== harzFlasche) {
      probleme.push(`Name "MFH ${m[1]}" ≠ Harz pro Flasche/Tank (${harzFlasche} l)`)
    }

    return { artNr: a.artNr, name: a.name, status: probleme.length === 0 ? 'ok' : 'fehler', probleme }
  })
}
