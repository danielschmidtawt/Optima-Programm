// ── Reinstwasser – Berechnungsmodul ──────────────────────────────────────────

// ── Harz-Kapazität ──────────────────────────────────────────────────────────

export interface HarzDaten {
  kapazitaet: number
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

  const bedarfLiterGesamt = totalMenge > 0
    ? totalMenge / (harz.kapazitaet * (420 / Math.max(mischLeitwert, 1)))
    : 0

  const bedarfEinheiten = totalMenge > 0
    ? Math.ceil(bedarfLiterGesamt / e.harzGroesse)
    : 0

  return { totalMenge, mischLeitwert, bedarfLiterGesamt, bedarfEinheiten }
}

// ── Nachspeisung ────────────────────────────────────────────────────────────

export interface Geraet {
  name: string
  maxLiter: number
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
}

export interface NachspeisungErgebnisse {
  anlageninhalt: number
  nachspeisungPA: number
  empfohlenerGeraet: Geraet
}

export function berechneNachspeisung(e: NachspeisungEingaben): NachspeisungErgebnisse {
  const anlageninhalt = e.inhaltManuell > 0
    ? e.inhaltManuell
    : (e.leistungKW * (e.fbhVorhanden ? 25 : 13)) + e.pufferLiter

  const nachspeisungPA = anlageninhalt * 0.03

  let empfohlenerGeraet = GERAETE[GERAETE.length - 1]
  for (const g of GERAETE) {
    if (nachspeisungPA <= g.maxLiter) {
      empfohlenerGeraet = g
      break
    }
  }

  return { anlageninhalt, nachspeisungPA, empfohlenerGeraet }
}
