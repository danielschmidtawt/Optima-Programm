// ── pH-Optima Konfiguration V1 – Berechnungsmodul ──────────────────────────
// Alle Berechnungen für Ionenaustauscher-Enthärtungsanlagen
// Normen: SVGW W3 (Spitzenvolumenstrom), EN 14743 (Enthärtungsanlagen)

export type AnlagenTyp = 'simplex' | 'duplex' | 'parallel'

export interface Eingaben {
  projektname: string
  bearbeiter: string
  rohwasserhaerte: number   // °dH
  resthaerte: number        // °dH
  personen: number
  bwLu: number              // Belastungswerte
  bwAuto: boolean
  anlagentyp: AnlagenTyp
  // Erweiterte Einstellungen
  verbrauchProPerson: number  // l/Tag
  regenIntervallTage: number  // Tage
  natriumRohwasser: number    // mg/l
  salzkosten: number          // CHF/kg
  volumenstromApparat: number // l/s (VA)
  druckverlustApparat: number // bar (ΔpA)
  bwProPerson: number         // BW pro Person Richtwert
}

// ── Produktkatalog ─────────────────────────────────────────────────────────
export type AnlagenKategorie = 'einzel_1' | 'twin_1' | 'einzel_1_5' | 'parallel_1_5' | 'einzel_2'

export interface Anlage {
  name: string
  artNr: string
  harz: number           // Liter Harzvolumen gesamt
  tank: string           // Tankbezeichnung
  zoll: number           // Zoll Durchmesser (Einzeltank)
  querschnitt: number    // dm² (Einzel-Querschnitt)
  harzhoehe: number      // dm (Harzhöhe im Tank / pro Tank bei Parallel)
  durchflussNormal: number  // l/min
  durchflussSpitze: number  // l/min
  kategorie: AnlagenKategorie
  betriebsart: AnlagenTyp
  // Parallel-spezifische Felder (nur bei parallel_1_5)
  harzProTank?: number          // Liter pro Tank
  querschnittGesamt?: number    // dm² Gesamt-Querschnitt (2 × Einzel)
  maxAnschlussFluss?: number    // l/min Ventilbegrenzung
  ventilBegrenztNormal?: boolean
  ventilBegrenztSpitze?: boolean
}

export const ANLAGEN_KATALOG: Anlage[] = [
  // === EINZELANLAGE CLACK 1" ===
  { name: 'pH-Optima MFH 15/WS1-CK',          artNr: '4388', harz: 15,  tank: '735',    zoll: 7,  querschnitt: 2.483,  harzhoehe: 6.0,  durchflussNormal: 8.3,   durchflussSpitze: 16.6,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 15/WS1-CK Kabinett',  artNr: '4389', harz: 15,  tank: '735',    zoll: 7,  querschnitt: 2.483,  harzhoehe: 6.0,  durchflussNormal: 8.3,   durchflussSpitze: 16.6,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 20/WS1-CK',          artNr: '4390', harz: 20,  tank: '835',    zoll: 8,  querschnitt: 3.243,  harzhoehe: 6.2,  durchflussNormal: 10.8,  durchflussSpitze: 21.6,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 20/WS1-CK Kabinett',  artNr: '4391', harz: 20,  tank: '835',    zoll: 8,  querschnitt: 3.243,  harzhoehe: 6.2,  durchflussNormal: 10.8,  durchflussSpitze: 21.6,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 25/WS1-CK',          artNr: '4392', harz: 25,  tank: '935',    zoll: 9,  querschnitt: 4.104,  harzhoehe: 6.1,  durchflussNormal: 13.7,  durchflussSpitze: 27.4,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 30/WS1-CK',          artNr: '4393', harz: 30,  tank: '1035',   zoll: 10, querschnitt: 5.067,  harzhoehe: 5.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 40/WS1-CK',          artNr: '4394', harz: 40,  tank: '1044',   zoll: 10, querschnitt: 5.067,  harzhoehe: 7.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 50/WS1-CK',          artNr: '4395', harz: 50,  tank: '1054',   zoll: 10, querschnitt: 5.067,  harzhoehe: 9.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 75/WS1-CK',          artNr: '4396', harz: 75,  tank: '1354',   zoll: 13, querschnitt: 8.563,  harzhoehe: 8.8,  durchflussNormal: 28.5,  durchflussSpitze: 57.1,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 100/WS1-CK',         artNr: '4397', harz: 100, tank: '1452',   zoll: 14, querschnitt: 9.931,  harzhoehe: 10.1, durchflussNormal: 33.1,  durchflussSpitze: 66.2,   kategorie: 'einzel_1', betriebsart: 'simplex' },
  // === PENDEL TWIN CLACK 1" ===
  { name: 'pH-Optima MFH 15/Twin-WS1-CK',     artNr: '4398', harz: 15,  tank: '735',    zoll: 7,  querschnitt: 2.483,  harzhoehe: 6.0,  durchflussNormal: 8.3,   durchflussSpitze: 16.6,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 20/Twin-WS1-CK',     artNr: '4399', harz: 20,  tank: '835',    zoll: 8,  querschnitt: 3.243,  harzhoehe: 6.2,  durchflussNormal: 10.8,  durchflussSpitze: 21.6,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 30/Twin-WS1-CK',     artNr: '4400', harz: 30,  tank: '1035',   zoll: 10, querschnitt: 5.067,  harzhoehe: 5.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 40/Twin-WS1-CK',     artNr: '4401', harz: 40,  tank: '1044',   zoll: 10, querschnitt: 5.067,  harzhoehe: 7.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 50/Twin-WS1-CK',     artNr: '4402', harz: 50,  tank: '1054',   zoll: 10, querschnitt: 5.067,  harzhoehe: 9.9,  durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 75/Twin-WS1-CK',     artNr: '4403', harz: 75,  tank: '1354',   zoll: 10, querschnitt: 5.067,  harzhoehe: 14.8, durchflussNormal: 16.9,  durchflussSpitze: 33.8,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  { name: 'pH-Optima MFH 100/Twin-WS1-CK',    artNr: '4404', harz: 100, tank: '1452',   zoll: 14, querschnitt: 9.931,  harzhoehe: 10.1, durchflussNormal: 33.1,  durchflussSpitze: 66.2,   kategorie: 'twin_1',   betriebsart: 'duplex' },
  // === EINZELANLAGE CLACK 1,5" ===
  { name: 'pH-Optima MFH 100/WS1,5-CK',       artNr: '4417', harz: 100, tank: '1452',   zoll: 14, querschnitt: 9.931,  harzhoehe: 10.1, durchflussNormal: 33.1,  durchflussSpitze: 66.2,   kategorie: 'einzel_1_5', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 150/WS1,5-CK',       artNr: '4418', harz: 150, tank: '1665-4', zoll: 16, querschnitt: 12.972, harzhoehe: 11.6, durchflussNormal: 43.2,  durchflussSpitze: 86.5,   kategorie: 'einzel_1_5', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 200/WS1,5-CK',       artNr: '4419', harz: 200, tank: '1865',   zoll: 18, querschnitt: 16.417, harzhoehe: 12.2, durchflussNormal: 54.7,  durchflussSpitze: 109.4,  kategorie: 'einzel_1_5', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 250/WS1,5-CK',       artNr: '4420', harz: 250, tank: '2160',   zoll: 21, querschnitt: 22.346, harzhoehe: 11.2, durchflussNormal: 74.5,  durchflussSpitze: 149.0,  kategorie: 'einzel_1_5', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 350/WS1,5-CK',       artNr: '4421', harz: 350, tank: '2469',   zoll: 24, querschnitt: 29.186, harzhoehe: 12.0, durchflussNormal: 97.3,  durchflussSpitze: 194.6,  kategorie: 'einzel_1_5', betriebsart: 'simplex' },
  // === PARALLEL 2x CLACK 1,5" ===
  // Beide Tanks gleichzeitig durchströmt über Parallelverteiler 1,5" Ein-/Ausgang
  // Ventilbegrenzung: 1,5" (DN40, ~40mm) → max. ca. 150.8 l/min bei 2 m/s
  { name: 'pH-Optima MFH 100/2xWS1,5-CK',     artNr: '4412', harz: 200, tank: '1452, 4"', zoll: 14, querschnitt: 9.931,  harzhoehe: 10.1, durchflussNormal: 66.2,   durchflussSpitze: 132.4,  kategorie: 'parallel_1_5', betriebsart: 'parallel', harzProTank: 100, querschnittGesamt: 19.863, maxAnschlussFluss: 150.8, ventilBegrenztNormal: false, ventilBegrenztSpitze: false },
  { name: 'pH-Optima MFH 150/2xWS1,5-CK',     artNr: '4413', harz: 300, tank: '1665-4',   zoll: 16, querschnitt: 12.972, harzhoehe: 11.6, durchflussNormal: 86.5,   durchflussSpitze: 150.8,  kategorie: 'parallel_1_5', betriebsart: 'parallel', harzProTank: 150, querschnittGesamt: 25.943, maxAnschlussFluss: 150.8, ventilBegrenztNormal: false, ventilBegrenztSpitze: true },
  { name: 'pH-Optima MFH 200/2xWS1,5-CK',     artNr: '4414', harz: 400, tank: '1865, 4"', zoll: 18, querschnitt: 16.417, harzhoehe: 12.2, durchflussNormal: 109.4,  durchflussSpitze: 150.8,  kategorie: 'parallel_1_5', betriebsart: 'parallel', harzProTank: 200, querschnittGesamt: 32.835, maxAnschlussFluss: 150.8, ventilBegrenztNormal: false, ventilBegrenztSpitze: true },
  { name: 'pH-Optima MFH 250/2xWS1,5-CK',     artNr: '4415', harz: 500, tank: '2160, 4"', zoll: 21, querschnitt: 22.346, harzhoehe: 11.2, durchflussNormal: 149.0,  durchflussSpitze: 150.8,  kategorie: 'parallel_1_5', betriebsart: 'parallel', harzProTank: 250, querschnittGesamt: 44.692, maxAnschlussFluss: 150.8, ventilBegrenztNormal: false, ventilBegrenztSpitze: true },
  { name: 'pH-Optima MFH 350/2xWS1,5-CK',     artNr: '4416', harz: 700, tank: '2469, 4"', zoll: 24, querschnitt: 29.186, harzhoehe: 12.0, durchflussNormal: 150.8,  durchflussSpitze: 150.8,  kategorie: 'parallel_1_5', betriebsart: 'parallel', harzProTank: 350, querschnittGesamt: 58.373, maxAnschlussFluss: 150.8, ventilBegrenztNormal: true,  ventilBegrenztSpitze: true },
  // === EINZELANLAGE CLACK 2" ===
  { name: 'pH-Optima MFH 200/WS2-CK',         artNr: '4422', harz: 200, tank: '1865',   zoll: 18, querschnitt: 16.417, harzhoehe: 12.2, durchflussNormal: 54.7,  durchflussSpitze: 109.4,  kategorie: 'einzel_2', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 250/WS2-CK',         artNr: '4423', harz: 250, tank: '2160',   zoll: 21, querschnitt: 22.346, harzhoehe: 11.2, durchflussNormal: 74.5,  durchflussSpitze: 149.0,  kategorie: 'einzel_2', betriebsart: 'simplex' },
  { name: 'pH-Optima MFH 350/WS2-CK',         artNr: '4424', harz: 350, tank: '2469',   zoll: 24, querschnitt: 29.186, harzhoehe: 12.0, durchflussNormal: 97.3,  durchflussSpitze: 194.6,  kategorie: 'einzel_2', betriebsart: 'simplex' },
]

const KATEGORIE_LABELS: Record<AnlagenKategorie, string> = {
  einzel_1: 'Einzelanlage Clack 1"',
  twin_1: 'Pendel Twin Clack 1"',
  einzel_1_5: 'Einzelanlage Clack 1,5"',
  parallel_1_5: 'Parallel 2x Clack 1,5"',
  einzel_2: 'Einzelanlage Clack 2"',
}

export function kategorieLabel(k: AnlagenKategorie): string {
  return KATEGORIE_LABELS[k]
}

// Anlagenempfehlung: passende Anlage aus Katalog finden
function findePassendeAnlage(
  anlagentyp: AnlagenTyp,
  harzmengeProFlasche: number,
  volumenstromEnthaerterLMin: number,
): { empfohlen: Anlage | null; alternativen: Anlage[] } {
  // Filter nach Betriebsart
  const passend = ANLAGEN_KATALOG
    .filter(a => a.betriebsart === anlagentyp)
    // Harzmenge der Anlage muss >= berechnete Harzmenge pro Flasche sein
    .filter(a => a.harz >= harzmengeProFlasche)
    // Spitzendurchfluss muss >= berechneter Volumenstrom durch Enthärter sein
    .filter(a => a.durchflussSpitze >= volumenstromEnthaerterLMin)
    // Sortieren: kleinste passende zuerst (nach Harzvolumen)
    .sort((a, b) => a.harz - b.harz || a.durchflussSpitze - b.durchflussSpitze)

  return {
    empfohlen: passend[0] ?? null,
    alternativen: passend.slice(1, 3), // bis zu 2 Alternativen
  }
}

export interface Ergebnisse {
  // Volumenstrom & Gleichzeitigkeit
  spitzenvolumenstrom: number    // l/s – V1 aus BW
  volumenstromEnthaerter: number // l/s – VE
  druckverlust: number           // bar – ΔpE
  // Harzmenge
  harzmengeGesamt: number        // Liter (Gesamtharz im System)
  harzmengeProFlasche: number    // Liter (pro einzelne Flasche)
  anzahlFlaschen: number
  // Regeneration
  regenIntervallProFlasche: number // Tage
  regenAmpel: 'gruen' | 'gelb' | 'rot'
  // Betriebsdaten
  tagesverbrauch: number         // Liter
  durchEnthaerter: number        // Liter
  verschneidungProzent: number   // %
  salzverbrauchMonat: number     // kg
  salzverbrauchJahr: number      // kg
  betriebskostenJahr: number     // CHF
  // Sicherheit
  natriumNachEnthaertung: number // mg/l
  natriumWarnung: boolean
  // Verschneidung
  weichwasserAnteil: number      // %
  rohwasserAnteil: number        // %
  // Anlagenempfehlung
  empfehlung: string
  anlagentypEmpfehlung: string
  // Anlagenvorschlag aus Produktkatalog
  empfohleneAnlage: Anlage | null
  alternativeAnlagen: Anlage[]
}

// SVGW W3 Diagramm 1: Spitzenvolumenstrom aus BW
// Vereinfachte Formel: V1 = 0.0682 * BW^0.535 (Approximation der W3-Kurve)
function spitzenvolumenstromW3(bw: number): number {
  if (bw <= 0) return 0
  return 0.0682 * Math.pow(bw, 0.535)
}

// Nutzbare Harzkapazität bei Regeneration mit ~150 g NaCl/l Harz
// Typisch für Hochleistungs-Kationenaustauscher: 4.5–5.5 °dH·m³/l
const HARZ_KAPAZITAET = 5.0 // °dH·m³/l Harz

// Natriumzunahme pro °dH Enthärtung: ca. 8.2 mg/l Na+ pro °dH (Stöchiometrie Ionentausch)
const NATRIUM_PRO_DH = 8.2

// Salzverbrauch pro Liter Harz bei Regeneration: ca. 0.15 kg NaCl (Bereich 80–160 g/l)
const SALZ_PRO_LITER_HARZ = 0.15

// Schwelle für Duplex-Empfehlung: ab >20 Personen
const DUPLEX_EMPFEHLUNG_PERSONEN = 20

export function berechne(e: Eingaben): Ergebnisse {
  // Grunddaten
  const tagesverbrauch = e.personen * e.verbrauchProPerson // Liter/Tag

  // Verschneidung: Anteil Weichwasser (0°dH nach Austauscher) und Rohwasser
  // Resthärte = rohwasserAnteil × rohwasserhärte + weichwasserAnteil × 0
  // → weichwasserAnteil = 1 - (resthaerte / rohwasserhaerte)
  const weichwasserAnteil = e.rohwasserhaerte > 0
    ? Math.max(0, Math.min(1, 1 - e.resthaerte / e.rohwasserhaerte))
    : 0
  const rohwasserAnteil = 1 - weichwasserAnteil

  // Durch Enthärter fliessende Wassermenge pro Tag
  const durchEnthaerter = tagesverbrauch * weichwasserAnteil

  // Volumenstrom (SVGW W3)
  const spitzenvolumenstrom = spitzenvolumenstromW3(e.bwLu)
  // VE: Anteil des Volumenstroms, der durch Enthärter fliesst
  const volumenstromEnthaerter = spitzenvolumenstrom * weichwasserAnteil

  // Druckverlust ΔpE (vereinfacht proportional zu V²)
  // Simplex: voller Volumenstrom durch 1 Flasche
  // Duplex: voller Volumenstrom durch 1 Flasche (nur 1 aktiv im Pendelbetrieb)
  // Parallel: halber Volumenstrom pro Flasche (beide gleichzeitig durchströmt)
  const vaRef = e.volumenstromApparat
  const dpRef = e.druckverlustApparat
  let druckverlust = 0
  if (vaRef > 0) {
    if (e.anlagentyp === 'parallel') {
      // Beide Tanks gleichzeitig → halber Volumenstrom pro Tank → 1/4 Druckverlust
      const veProTank = volumenstromEnthaerter / 2
      druckverlust = dpRef * Math.pow(veProTank / vaRef, 2)
    } else {
      druckverlust = dpRef * Math.pow(volumenstromEnthaerter / vaRef, 2)
    }
  }

  // ── Harzmenge ──────────────────────────────────────────────────────────────
  // Benötigte Kapazität für einen Regenerationszyklus
  const durchEnthaerterProZyklus = durchEnthaerter * e.regenIntervallTage // Liter
  const benoetigteKapazitaet = (durchEnthaerterProZyklus / 1000) * e.rohwasserhaerte // °dH·m³

  // Harzvolumen für einen vollen Zyklus
  const harzFuerEinenZyklus = benoetigteKapazitaet / HARZ_KAPAZITAET // Liter

  let harzmengeProFlasche: number
  let harzmengeGesamt: number
  let anzahlFlaschen: number

  if (e.anlagentyp === 'simplex') {
    // Simplex: 1 Flasche, muss vollen Zyklus allein abdecken
    anzahlFlaschen = 1
    harzmengeProFlasche = harzFuerEinenZyklus
    harzmengeGesamt = harzmengeProFlasche
  } else if (e.anlagentyp === 'duplex') {
    // Duplex (Pendel): 2 Flaschen abwechselnd, nur 1 aktiv
    // Jede Flasche muss allein den vollen Zyklus abdecken können
    anzahlFlaschen = 2
    harzmengeProFlasche = Math.ceil(harzFuerEinenZyklus * 10) / 10 // Aufrunden auf 0.1 l
    harzmengeGesamt = harzmengeProFlasche * 2
  } else {
    // Parallel: 2 Tanks gleichzeitig durchströmt, Harz auf 2 Tanks verteilt
    // Gesamtkapazität = Zyklusbedarf, aufgeteilt auf 2 Tanks
    anzahlFlaschen = 2
    harzmengeGesamt = Math.ceil(harzFuerEinenZyklus * 10) / 10
    harzmengeProFlasche = Math.ceil((harzmengeGesamt / 2) * 10) / 10
  }

  // ── Regenerationsintervall ─────────────────────────────────────────────────
  const kapazitaetProFlasche = harzmengeProFlasche * HARZ_KAPAZITAET // °dH·m³
  const tagesbedarf = (durchEnthaerter / 1000) * e.rohwasserhaerte // °dH·m³ pro Tag

  // Simplex & Parallel: gesamte Kapazität nimmt den vollen Tagesbedarf auf
  // Duplex: jeweils 1 Flasche nimmt den vollen Tagesbedarf auf (andere in Standby)
  let regenIntervallProFlasche: number
  if (tagesbedarf <= 0) {
    regenIntervallProFlasche = Infinity
  } else if (e.anlagentyp === 'parallel') {
    // Parallel: Gesamtkapazität beider Tanks / Tagesbedarf
    const kapazitaetGesamt = harzmengeGesamt * HARZ_KAPAZITAET
    regenIntervallProFlasche = kapazitaetGesamt / tagesbedarf
  } else {
    regenIntervallProFlasche = kapazitaetProFlasche / tagesbedarf
  }

  // Ampelsystem (EN 14743: max. 4 Tage empfohlen)
  let regenAmpel: 'gruen' | 'gelb' | 'rot'
  if (regenIntervallProFlasche >= 2) {
    regenAmpel = 'gruen'
  } else if (regenIntervallProFlasche >= 1) {
    regenAmpel = 'gelb'
  } else {
    regenAmpel = 'rot'
  }

  // ── Salzverbrauch ──────────────────────────────────────────────────────────
  // Regenerationen pro Monat (Gesamtsystem):
  // Simplex: 1 Flasche regeneriert alle <interval> Tage → 30/interval
  // Duplex:  Flaschen alternieren, System regeneriert 1 Flasche pro Intervall → 30/interval
  // Parallel: Beide Tanks gleichzeitig → Gesamtharz pro Regeneration
  const regenProMonat = regenIntervallProFlasche > 0
    ? 30 / regenIntervallProFlasche
    : 0
  // Bei Parallel wird die gesamte Harzmenge regeneriert (beide Tanks)
  const salzProRegen = (e.anlagentyp === 'parallel' ? harzmengeGesamt : harzmengeProFlasche) * SALZ_PRO_LITER_HARZ // kg
  const salzverbrauchMonat = regenProMonat * salzProRegen
  const salzverbrauchJahr = salzverbrauchMonat * 12
  const betriebskostenJahr = salzverbrauchJahr * e.salzkosten

  // ── Natrium (Sicherheit, Grenzwert 200 mg/l gemäss TBDV/WHO) ──────────────
  const natriumImWeichwasser = e.natriumRohwasser + e.rohwasserhaerte * NATRIUM_PRO_DH
  // Nach Verschneidung
  const natriumNachEnthaertung = natriumImWeichwasser * weichwasserAnteil
    + e.natriumRohwasser * rohwasserAnteil

  // ── Anlagentyp-Empfehlung ──────────────────────────────────────────────────
  const anlagentypEmpfehlung = e.personen > DUPLEX_EMPFEHLUNG_PERSONEN
    ? 'Duplex-Anlage empfohlen: Ab ' + DUPLEX_EMPFEHLUNG_PERSONEN + ' Personen ist eine unterbrechungsfreie Weichwasserversorgung sinnvoll. Während der Regeneration einer Flasche übernimmt die zweite Flasche – 24/7 Weichwasser garantiert.'
    : 'Simplex-Anlage ausreichend: Regeneration kann in Schwachlastzeiten (z.B. nachts) programmiert werden.'

  // ── Empfehlungstext ────────────────────────────────────────────────────────
  const typText = e.anlagentyp === 'simplex'
    ? 'Simplex-Anlage (1 Harzflasche)'
    : e.anlagentyp === 'duplex'
      ? 'Duplex-Anlage (2 Flaschen, Pendelbetrieb)'
      : 'Parallel-Anlage (2 Tanks, gleichzeitig durchströmt)'

  const empfehlung = [
    `Empfohlene Konfiguration: ${typText}.`,
    `Gesamtes Harzvolumen: ${harzmengeGesamt.toFixed(1)} Liter` +
      (e.anlagentyp === 'parallel' ? ` (2 Tanks × ${harzmengeProFlasche.toFixed(1)} Liter)` :
       anzahlFlaschen === 2 ? ` (2 × ${harzmengeProFlasche.toFixed(1)} Liter)` : '') + '.',
    `Regenerationsintervall: ca. ${Math.min(regenIntervallProFlasche, 999).toFixed(1)} Tage pro Flasche.`,
    `Salzvorrat: ca. ${salzverbrauchMonat.toFixed(1)} kg/Monat (${salzverbrauchJahr.toFixed(0)} kg/Jahr).`,
    regenAmpel === 'rot'
      ? '⚠ Kritisch: Regenerationsintervall unter 1 Tag – grössere Anlage oder weniger Personen empfohlen.'
      : regenAmpel === 'gelb'
        ? 'Hinweis: Regenerationsintervall knapp – Anlage prüfen.'
        : 'Regenerationsintervall im optimalen Bereich.',
  ].join('\n')

  // ── Anlagenvorschlag aus Produktkatalog ──────────────────────────────────
  const volumenstromEnthaerterLMin = volumenstromEnthaerter * 60 // l/s → l/min
  // Parallel: Katalog-Harz = Gesamtharz (beide Tanks), daher mit harzmengeGesamt matchen
  // Simplex/Duplex: Katalog-Harz = Harz pro Flasche
  const harzFuerMatching = e.anlagentyp === 'parallel' ? harzmengeGesamt : harzmengeProFlasche
  const { empfohlen: empfohleneAnlage, alternativen: alternativeAnlagen } =
    findePassendeAnlage(e.anlagentyp, harzFuerMatching, volumenstromEnthaerterLMin)

  return {
    spitzenvolumenstrom,
    volumenstromEnthaerter,
    druckverlust,
    harzmengeGesamt: Math.max(0, harzmengeGesamt),
    harzmengeProFlasche: Math.max(0, harzmengeProFlasche),
    anzahlFlaschen,
    regenIntervallProFlasche: Math.min(regenIntervallProFlasche, 999),
    regenAmpel,
    tagesverbrauch,
    durchEnthaerter,
    verschneidungProzent: weichwasserAnteil * 100,
    salzverbrauchMonat,
    salzverbrauchJahr,
    betriebskostenJahr,
    natriumNachEnthaertung,
    natriumWarnung: natriumNachEnthaertung > 200,
    weichwasserAnteil: weichwasserAnteil * 100,
    rohwasserAnteil: rohwasserAnteil * 100,
    empfehlung,
    anlagentypEmpfehlung,
    empfohleneAnlage,
    alternativeAnlagen,
  }
}

// Einheitenumrechner
export function dhToFh(dh: number): number { return dh * 1.7848 }
export function fhToDh(fh: number): number { return fh / 1.7848 }
export function dhToMmol(dh: number): number { return dh * 0.1783 }
export function mmolToDh(mmol: number): number { return mmol / 0.1783 }
export function fhToMmol(fh: number): number { return dhToMmol(fhToDh(fh)) }
export function mmolToFh(mmol: number): number { return dhToFh(mmolToDh(mmol)) }
