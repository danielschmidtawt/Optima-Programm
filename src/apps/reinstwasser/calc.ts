// ── Reinstwasser – Berechnungsmodul ──────────────────────────────────────────

// Referenz-Leitwert, auf den alle Kapazitätsangaben bezogen sind
export const REFERENZ_LEITWERT = 420 // µS/cm

// ── Harz-Kapazität ──────────────────────────────────────────────────────────

export interface HarzDaten {
  kapazitaet: number // Liter Wasser pro Liter Harz bei 420 µS/cm
}

export const HARZ_GROESSEN: number[] = [0.75, 1.5, 3, 7, 14, 23, 62]

export const HARZ_DATEN: Record<string, HarzDaten> = {
  '0.75': { kapazitaet: 153.33 },
  '1.5':  { kapazitaet: 153.33 },
  '3':    { kapazitaet: 152.50 },
  '7':    { kapazitaet: 155.79 },
  '14':   { kapazitaet: 156.09 },
  '23':   { kapazitaet: 159.65 },
  '62':   { kapazitaet: 155.00 },
}

export interface HarzEingaben {
  leitwertFrisch: number    // µS/cm
  mengeFrisch: number       // Liter
  leitwertBestand: number   // µS/cm
  mengeBestand: number      // Liter
  harzGroesse: number       // Liter (0.75, 1.5, 3, 7, 14, 23, 62)
}

export interface HarzErgebnisse {
  totalMenge: number          // Liter
  mischLeitwert: number       // µS/cm
  bedarfLiterGesamt: number   // Liter
  bedarfEinheiten: number     // Stück
}

export function berechneHarz(e: HarzEingaben): HarzErgebnisse {
  const harz = HARZ_DATEN[String(e.harzGroesse)]
  if (!harz) {
    return { totalMenge: 0, mischLeitwert: 0, bedarfLiterGesamt: 0, bedarfEinheiten: 0 }
  }

  const totalMenge = e.mengeFrisch + e.mengeBestand

  const mischLeitwert = totalMenge > 0
    ? ((e.mengeFrisch * e.leitwertFrisch) + (e.mengeBestand * e.leitwertBestand)) / totalMenge
    : e.leitwertFrisch

  // Kapazität skaliert mit Leitwert: bei höherem LF weniger Wasser pro Liter Harz
  const bedarfLiterGesamt = totalMenge > 0
    ? totalMenge / (harz.kapazitaet * (REFERENZ_LEITWERT / Math.max(mischLeitwert, 1)))
    : 0

  const bedarfEinheiten = totalMenge > 0
    ? Math.ceil(bedarfLiterGesamt / e.harzGroesse)
    : 0

  return { totalMenge, mischLeitwert, bedarfLiterGesamt, bedarfEinheiten }
}

// ── Nachspeisung ────────────────────────────────────────────────────────────

// Anlageninhalt-Richtwerte (l pro kW Heizleistung)
export const INHALT_PRO_KW_RADIATOR = 13
export const INHALT_PRO_KW_FBH = 25

// Jährliche Nachspeisung als Anteil des Anlageninhalts (Erfahrungswert)
export const NACHSPEISUNG_ANTEIL_PA = 0.03

export interface Geraet {
  name: string
  maxLiter: number // Kapazität in Liter Wasser bei 420 µS/cm
}

export const GERAETE: Geraet[] = [
  { name: 'pH-Optima MH10', maxLiter: 1380 },
  { name: 'pH-Optima MH20', maxLiter: 2760 },
  { name: 'pH-Optima MH40', maxLiter: 5520 },
  { name: 'pH-Optima M+',   maxLiter: 12600 },
]

export interface NachspeisungEingaben {
  leistungKW: number
  pufferLiter: number
  fbhVorhanden: boolean
  inhaltManuell: number
  leitwertNachspeisung: number // µS/cm Rohwasser der Nachspeisung (Referenz 420)
}

export interface NachspeisungErgebnisse {
  anlageninhalt: number
  nachspeisungPA: number
  empfohlenerGeraet: Geraet
  effektiveKapazitaet: number // l/Jahr des empfohlenen Geräts beim eingestellten Leitwert
  reichweiteJahre: number     // Patronen-Reichweite in Jahren
  ueberKapazitaet: boolean    // Nachspeisung übersteigt selbst das grösste Gerät
}

export function berechneNachspeisung(e: NachspeisungEingaben): NachspeisungErgebnisse {
  const anlageninhalt = e.inhaltManuell > 0
    ? e.inhaltManuell
    : (e.leistungKW * (e.fbhVorhanden ? INHALT_PRO_KW_FBH : INHALT_PRO_KW_RADIATOR)) + e.pufferLiter

  const nachspeisungPA = anlageninhalt * NACHSPEISUNG_ANTEIL_PA

  // Gerätekapazität ist auf 420 µS/cm bezogen – auf realen Leitwert umrechnen.
  // Höherer Leitwert = mehr Ionenfracht = weniger nutzbare Liter pro Patrone.
  const leitwert = e.leitwertNachspeisung > 0 ? e.leitwertNachspeisung : REFERENZ_LEITWERT
  const kapazitaetsFaktor = REFERENZ_LEITWERT / leitwert

  let empfohlenerGeraet = GERAETE[GERAETE.length - 1]
  let ueberKapazitaet = nachspeisungPA > 0
  for (const g of GERAETE) {
    if (nachspeisungPA <= g.maxLiter * kapazitaetsFaktor) {
      empfohlenerGeraet = g
      ueberKapazitaet = false
      break
    }
  }

  const effektiveKapazitaet = empfohlenerGeraet.maxLiter * kapazitaetsFaktor
  const reichweiteJahre = nachspeisungPA > 0 ? effektiveKapazitaet / nachspeisungPA : Infinity

  return { anlageninhalt, nachspeisungPA, empfohlenerGeraet, effektiveKapazitaet, reichweiteJahre, ueberKapazitaet }
}
