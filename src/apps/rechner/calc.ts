// ── pH-Optima Konfiguration V1 – Berechnungsmodul ──────────────────────────
// Alle Berechnungen für Ionenaustauscher-Enthärtungsanlagen
// Normen: SVGW W3 (Spitzenvolumenstrom), EN 14743 (Enthärtungsanlagen)

export type AnlagenTyp = 'simplex' | 'duplex' | 'parallel'

export type AnschlussGroesse = '' | '1"' | '5/4"' | '1½"' | '2"'

export type HaerteEinheit = 'dH' | 'fH'
export type Waehrung = 'CHF' | 'EUR'

// Auslegungsmodus: ändert NUR Ziel-/Ampelgrenzen und die Auto-Auswahl, nicht die Physik.
// robust  = niedrige Filtergeschwindigkeit/-Δp → grössere Flasche, seltene Regeneration
// kompakt = höhere Geschwindigkeit/Δp zulässig (Grünbeck-Prinzip) → kleinere Flasche
export type Modus = 'robust' | 'kompakt'

// Max. Filtergeschwindigkeit [m/h] für die AUTO-AUSWAHL je Modus
// (robust = Grüngrenze, kompakt = Gelbgrenze; Anzeige-Grenzen: engineering.ts GRENZWERTE)
export const AUTO_AUSWAHL_V_MAX: Record<Modus, number> = { robust: 40, kompakt: 75 }

export interface Eingaben {
  projektname: string
  bearbeiter: string
  rohwasserhaerte: number   // in gewählter Härte-Einheit
  resthaerte: number        // in gewählter Härte-Einheit
  haerteEinheit: HaerteEinheit
  personen: number
  bwLu: number              // Belastungswerte
  bwAuto: boolean
  anlagentyp: AnlagenTyp
  anschluss: AnschlussGroesse
  modus: Modus
  v1Auto: boolean           // true = V1 aus BW (SVGW W3), false = manuell
  v1Manuell: number         // l/s – nur bei v1Auto = false
  // Erweiterte Einstellungen
  verbrauchProPerson: number  // l/Tag
  regenIntervallTage: number  // Tage (Auslegungsintervall)
  reserveTage: number         // Tage Kapazitätsreserve (Anlage regeneriert vor Erschöpfung)
  maxRegenIntervall: number   // Tage Zwangsregeneration (0 = keine); Trinkwasser-Hygiene
  natriumRohwasser: number    // mg/l
  salzkosten: number          // pro kg, in gewählter Währung
  waehrung: Waehrung
  volumenstromApparat: number // l/s (VA) – VERALTET: Δp jetzt über Bett-Formel (druckverlustBar)
  druckverlustApparat: number // bar (ΔpA) – VERALTET: Δp jetzt über Bett-Formel
  bwProPerson: number         // BW pro Person Richtwert
}

// ── Produktkatalog ─────────────────────────────────────────────────────────
export type AnlagenKategorie = 'einzel_1' | 'twin_1' | 'parallel_1' | 'einzel_1_5' | 'parallel_1_5' | 'einzel_2' | 'parallel_2'

// ── Tankdaten (geprüfte Herstellerliste – SINGLE SOURCE OF TRUTH) ──────────
// Code = Ø[Zoll] × Höhe[Zoll]. Alle Geometrie-/Volumendaten stammen von hier.
export interface TankDaten {
  zoll: number
  flaecheDm2: number      // A [dm²]
  innenvolumenL: number   // Tank-Innenvolumen [l]
}

export const TANK_DATEN: Record<string, TankDaten> = {
  '735':  { zoll: 7,  flaecheDm2: 2.48,  innenvolumenL: 20.4 },
  '835':  { zoll: 8,  flaecheDm2: 3.24,  innenvolumenL: 25.7 },
  '935':  { zoll: 9,  flaecheDm2: 4.10,  innenvolumenL: 31.3 },
  '1035': { zoll: 10, flaecheDm2: 5.06,  innenvolumenL: 38.9 },
  '1044': { zoll: 10, flaecheDm2: 5.06,  innenvolumenL: 48.0 },
  '1054': { zoll: 10, flaecheDm2: 5.06,  innenvolumenL: 60.7 },
  '1354': { zoll: 13, flaecheDm2: 8.56,  innenvolumenL: 103.1 },
  '1452': { zoll: 14, flaecheDm2: 9.93,  innenvolumenL: 115.4 },
  '1665': { zoll: 16, flaecheDm2: 12.97, innenvolumenL: 170.0 },
  '1865': { zoll: 18, flaecheDm2: 16.41, innenvolumenL: 250.0 },
  '2160': { zoll: 21, flaecheDm2: 22.33, innenvolumenL: 309.0 },
  '2469': { zoll: 24, flaecheDm2: 29.17, innenvolumenL: 436.0 },
}

// Hersteller-Auslegungs-/Betriebsgeschwindigkeit: 60 m/h
// → Nenndurchfluss je Flasche = A[dm²] × 10 l/min
export const NENN_GESCHWINDIGKEIT_MH = 60
// Kurzzeitige Spitze / physikalisches Hartlimit
export const SPITZEN_GESCHWINDIGKEIT_MH = 80
// 2"-Parallelverteiler (DN50, 2 m/s)
export const VERTEILER_2ZOLL_LMIN = 243.2

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
  // Optional: Flaschen-Innenvolumen [l] für Freibord-Prüfung (fehlt = Datenlücke)
  innenvolumenL?: number
  // Parallel-spezifische Felder (nur bei parallel_1 und parallel_1_5)
  harzProTank?: number          // Liter pro Tank
  querschnittGesamt?: number    // dm² Gesamt-Querschnitt (2 × Einzel)
  maxAnschlussFluss?: number    // l/min Ventilbegrenzung
  ventilBegrenztNormal?: boolean
  ventilBegrenztSpitze?: boolean
}

// ── Katalog wird aus TANK_DATEN generiert (Single Source of Truth) ─────────
// Nenndurchfluss je Flasche = A × 10 l/min (60 m/h Hersteller-Auslegung)
// Spitze je Flasche = A × 80/6 l/min (kurzzeitig, Hartlimit 80 m/h)
// Parallel: 2 Flaschen, begrenzt durch den 2"-Verteiler (243.2 l/min)

const r1 = (n: number) => Math.round(n * 10) / 10

function einzelAnlage(
  name: string, artNr: string, harz: number, tankCode: string,
  kategorie: AnlagenKategorie, betriebsart: 'simplex' | 'duplex',
): Anlage {
  const t = TANK_DATEN[tankCode]
  return {
    name, artNr, harz, tank: tankCode,
    zoll: t.zoll, querschnitt: t.flaecheDm2, innenvolumenL: t.innenvolumenL,
    harzhoehe: r1(harz / t.flaecheDm2),
    durchflussNormal: r1(t.flaecheDm2 * NENN_GESCHWINDIGKEIT_MH / 6),
    durchflussSpitze: r1(t.flaecheDm2 * SPITZEN_GESCHWINDIGKEIT_MH / 6),
    kategorie, betriebsart,
  }
}

function parallelAnlage(
  name: string, artNr: string, harzProTank: number, tankCode: string,
  kategorie: AnlagenKategorie, verteilerLmin?: number,
): Anlage {
  const t = TANK_DATEN[tankCode]
  const nenn2 = 2 * t.flaecheDm2 * NENN_GESCHWINDIGKEIT_MH / 6
  const spitze2 = 2 * t.flaecheDm2 * SPITZEN_GESCHWINDIGKEIT_MH / 6
  const nennBegrenzt = verteilerLmin != null && nenn2 > verteilerLmin
  const spitzeBegrenzt = verteilerLmin != null && spitze2 > verteilerLmin
  return {
    name, artNr, harz: harzProTank * 2, tank: tankCode,
    zoll: t.zoll, querschnitt: t.flaecheDm2, innenvolumenL: t.innenvolumenL,
    harzhoehe: r1(harzProTank / t.flaecheDm2),
    durchflussNormal: r1(nennBegrenzt ? verteilerLmin! : nenn2),
    durchflussSpitze: r1(spitzeBegrenzt ? verteilerLmin! : spitze2),
    kategorie, betriebsart: 'parallel',
    harzProTank, querschnittGesamt: r1(2 * t.flaecheDm2 * 100) / 100,
    maxAnschlussFluss: verteilerLmin,
    ventilBegrenztNormal: nennBegrenzt, ventilBegrenztSpitze: spitzeBegrenzt,
  }
}

export const ANLAGEN_KATALOG: Anlage[] = [
  // === EINZELANLAGE CLACK 1" (WS1): 15/735 … 100/1452 ===
  einzelAnlage('pH-Optima MFH 15/WS1-CK',          '4388', 15,  '735',  'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 15/WS1-CK Kabinett', '4389', 15,  '735',  'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 20/WS1-CK',          '4390', 20,  '835',  'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 20/WS1-CK Kabinett', '4391', 20,  '835',  'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 25/WS1-CK',          '4392', 25,  '935',  'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 30/WS1-CK',          '4393', 30,  '1035', 'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 40/WS1-CK',          '4394', 40,  '1044', 'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 50/WS1-CK',          '4395', 50,  '1054', 'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 75/WS1-CK',          '4396', 75,  '1354', 'einzel_1', 'simplex'),
  einzelAnlage('pH-Optima MFH 100/WS1-CK',         '4397', 100, '1452', 'einzel_1', 'simplex'),
  // === PENDEL TWIN CLACK 1": 15/735 … 100/1452 (FIX: 75er auf Tank 1354/13") ===
  einzelAnlage('pH-Optima MFH 15/Twin-WS1-CK',  '4398', 15,  '735',  'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 20/Twin-WS1-CK',  '4399', 20,  '835',  'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 30/Twin-WS1-CK',  '4400', 30,  '1035', 'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 40/Twin-WS1-CK',  '4401', 40,  '1044', 'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 50/Twin-WS1-CK',  '4402', 50,  '1054', 'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 75/Twin-WS1-CK',  '4403', 75,  '1354', 'twin_1', 'duplex'),
  einzelAnlage('pH-Optima MFH 100/Twin-WS1-CK', '4404', 100, '1452', 'twin_1', 'duplex'),
  // === PARALLEL 2x CLACK 1": 15, 20, 30, 40, 50, 75, 100 (Herstellerliste ohne 25er) ===
  parallelAnlage('pH-Optima MFH 15/2xWS1-CK',  '4425', 15,  '735',  'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 20/2xWS1-CK',  '4426', 20,  '835',  'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 30/2xWS1-CK',  '4428', 30,  '1035', 'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 40/2xWS1-CK',  '4429', 40,  '1044', 'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 50/2xWS1-CK',  '4430', 50,  '1054', 'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 75/2xWS1-CK',  '4431', 75,  '1354', 'parallel_1', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 100/2xWS1-CK', '4432', 100, '1452', 'parallel_1', VERTEILER_2ZOLL_LMIN),
  // === EINZELANLAGE CLACK 1,5": 100/1452 … 350/2469 ===
  einzelAnlage('pH-Optima MFH 100/WS1,5-CK', '4417', 100, '1452', 'einzel_1_5', 'simplex'),
  einzelAnlage('pH-Optima MFH 150/WS1,5-CK', '4418', 150, '1665', 'einzel_1_5', 'simplex'),
  einzelAnlage('pH-Optima MFH 200/WS1,5-CK', '4419', 200, '1865', 'einzel_1_5', 'simplex'),
  einzelAnlage('pH-Optima MFH 250/WS1,5-CK', '4420', 250, '2160', 'einzel_1_5', 'simplex'),
  einzelAnlage('pH-Optima MFH 350/WS1,5-CK', '4421', 350, '2469', 'einzel_1_5', 'simplex'),
  // === PARALLEL 2x CLACK 1,5": 100 … 350 (2" Verteiler) ===
  parallelAnlage('pH-Optima MFH 100/2xWS1,5-CK', '4412', 100, '1452', 'parallel_1_5', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 150/2xWS1,5-CK', '4413', 150, '1665', 'parallel_1_5', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 200/2xWS1,5-CK', '4414', 200, '1865', 'parallel_1_5', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 250/2xWS1,5-CK', '4415', 250, '2160', 'parallel_1_5', VERTEILER_2ZOLL_LMIN),
  parallelAnlage('pH-Optima MFH 350/2xWS1,5-CK', '4416', 350, '2469', 'parallel_1_5', VERTEILER_2ZOLL_LMIN),
  // === EINZELANLAGE CLACK 2": 200/1865 … 350/2469 ===
  einzelAnlage('pH-Optima MFH 200/WS2-CK', '4422', 200, '1865', 'einzel_2', 'simplex'),
  einzelAnlage('pH-Optima MFH 250/WS2-CK', '4423', 250, '2160', 'einzel_2', 'simplex'),
  einzelAnlage('pH-Optima MFH 350/WS2-CK', '4424', 350, '2469', 'einzel_2', 'simplex'),
  // === PARALLEL 2x CLACK 2" (neu gemäss Herstellerliste; Art.Nr. & Verteilergrösse noch offen) ===
  parallelAnlage('pH-Optima MFH 200/2xWS2-CK', 'offen-200', 200, '1865', 'parallel_2'),
  parallelAnlage('pH-Optima MFH 250/2xWS2-CK', 'offen-250', 250, '2160', 'parallel_2'),
  parallelAnlage('pH-Optima MFH 350/2xWS2-CK', 'offen-350', 350, '2469', 'parallel_2'),
]

const KATEGORIE_LABELS: Record<AnlagenKategorie, string> = {
  einzel_1: 'Einzelanlage Clack 1"',
  twin_1: 'Pendel Twin Clack 1"',
  parallel_1: 'Parallel 2x Clack 1"',
  einzel_1_5: 'Einzelanlage Clack 1,5"',
  parallel_1_5: 'Parallel 2x Clack 1,5"',
  einzel_2: 'Einzelanlage Clack 2"',
  parallel_2: 'Parallel 2x Clack 2"',
}

export function kategorieLabel(k: AnlagenKategorie): string {
  return KATEGORIE_LABELS[k]
}

// Ventil-/Kopfgrösse der Anlage: Clack-Köpfe sind 5/4" (WS1 & WS1,5), nur WS2 hat 2"
export function kopfgroesse(k: AnlagenKategorie): string {
  switch (k) {
    case 'einzel_1':
    case 'twin_1':
    case 'parallel_1':
    case 'einzel_1_5':
    case 'parallel_1_5':
      return '5/4"'
    case 'einzel_2':
    case 'parallel_2':
      return '2"'
  }
}

// ── Druckverlust (Bett-Formel) ──────────────────────────────────────────────
// Δp_Bett[bar] ≈ DP_KOEFFIZIENT × v[m/h] × Betthöhe[m]  (Standard-Wohnbau-
// Enthärterharz, ~12 °C) + Ventil/Verteiler-Pauschale. Der Koeffizient ist
// EINE zentrale Konstante und kann später durch eine echte Harz-Δp-Kurve
// ersetzt werden. Immer bei der TATSÄCHLICHEN Betriebsgeschwindigkeit rechnen.
export const DP_KOEFFIZIENT_BAR_PRO_MH_M = 0.006
export const DP_VENTIL_BAR = 0.25

export function druckverlustBar(vMh: number, betthoeheM: number): number {
  if (vMh <= 0) return 0
  return DP_KOEFFIZIENT_BAR_PRO_MH_M * vMh * betthoeheM + DP_VENTIL_BAR
}

// Δp der konkreten Anlage bei gegebenem VE [l/s]
export function druckverlustFuerAnlage(anlage: Anlage, veLs: number): number {
  const qLmin = (anlage.betriebsart === 'parallel' ? veLs / 2 : veLs) * 60
  const vMh = (6 * qLmin) / anlage.querschnitt
  const hM = (anlage.harzProTank ?? anlage.harz) / anlage.querschnitt / 10
  return druckverlustBar(vMh, hM)
}

// Max. sinnvoller Durchfluss pro Anschlussgrösse bei ~2 m/s Fliessgeschwindigkeit
export const ANSCHLUSS_MAX_DURCHFLUSS: Record<string, number> = {
  '1"':   0.9,  // l/s
  '5/4"': 1.4,
  '1½"':  2.0,
  '2"':   3.3,
}

export interface FlussProKopfPruefung {
  flussProjKopfLMin: number
  nennProKopfLMin: number
  maxProKopfLMin: number
  status: 'ok' | 'spitze' | 'ueberlast'
  warnung: string | null
}

export function pruefeFlussProKopf(
  volumenstromEnthaerter: number,
  anlagentyp: AnlagenTyp,
  anlage: Anlage,
): FlussProKopfPruefung {
  const veProKopf = anlagentyp === 'parallel'
    ? volumenstromEnthaerter / 2
    : volumenstromEnthaerter
  const flussProjKopfLMin = veProKopf * 60

  const nennProKopfLMin = anlagentyp === 'parallel'
    ? anlage.durchflussNormal / 2
    : anlage.durchflussNormal
  const maxProKopfLMin = anlagentyp === 'parallel'
    ? anlage.durchflussSpitze / 2
    : anlage.durchflussSpitze

  const status: 'ok' | 'spitze' | 'ueberlast' =
    flussProjKopfLMin <= nennProKopfLMin ? 'ok'
    : flussProjKopfLMin <= maxProKopfLMin ? 'spitze'
    : 'ueberlast'

  const warnung = status === 'ueberlast'
    ? `Achtung: Durchfluss pro Kopf (${flussProjKopfLMin.toFixed(1)} l/min) übersteigt das Ventil-Maximum (${maxProKopfLMin.toFixed(1)} l/min). Grössere Anlage oder Parallelschaltung prüfen.`
    : null

  return { flussProjKopfLMin, nennProKopfLMin, maxProKopfLMin, status, warnung }
}

// Regenerationsintervall der KONKRETEN Anlage (nicht des theoretischen Minimums).
// anlage.harz: Simplex = Gesamtharz, Duplex = Harz pro Flasche (eine trägt allein),
// Parallel = Gesamtharz beider Tanks – in allen Fällen die tragende Kapazität.
export function intervallFuerAnlage(anlage: Anlage, tagesbedarfKapazitaet: number): number {
  if (tagesbedarfKapazitaet <= 0) return Infinity
  return (anlage.harz * HARZ_KAPAZITAET) / tagesbedarfKapazitaet
}

export function ampelFuerIntervall(tage: number): 'gruen' | 'gelb' | 'rot' {
  if (tage >= 2) return 'gruen'
  if (tage >= 1) return 'gelb'
  return 'rot'
}

// Zwangsregeneration Trinkwasser (Hygiene): In CH (SVGW-Praxis, EN 14743),
// AT (ÖNORM/ÖVGW-Praxis) und DE (DIN 19636-100) gilt als Richtwert:
// Enthärtungsanlagen im Trinkwasser spätestens alle 4 Tage regenerieren.
export const ZWANGSREGENERATION_TAGE = 4

// Betriebsdaten der KONKRET gewählten Anlage inkl. Zwangsregeneration:
// Ist die Kapazität grösser als das erlaubte Intervall, regeneriert die Anlage
// zwangsweise früher – mit voller Besalzung. Grössere Anlagen verbrauchen dann
// MEHR Salz, weil das Harz nicht ausgenutzt wird.
export interface AnlagenBetrieb {
  intervallNatuerlich: number  // Tage – Kapazität / Tagesbedarf
  intervallEffektiv: number    // Tage – min(natürlich, Zwangsregeneration)
  zwangsregeneration: boolean  // true = Zwangsregeneration greift vor Erschöpfung
  regenProMonat: number
  salzProRegen: number         // kg
  salzMonat: number            // kg
  salzJahr: number             // kg
  kostenJahr: number           // in gewählter Währung
}

export function betriebFuerAnlage(
  anlage: Anlage,
  tagesbedarfKapazitaet: number,
  maxIntervall: number,
  salzkostenProKg: number,
): AnlagenBetrieb {
  const intervallNatuerlich = intervallFuerAnlage(anlage, tagesbedarfKapazitaet)
  const max = maxIntervall > 0 ? maxIntervall : Infinity
  const intervallEffektiv = Math.min(intervallNatuerlich, max)
  const zwangsregeneration = intervallNatuerlich > max
  const regenProMonat = isFinite(intervallEffektiv) && intervallEffektiv > 0
    ? 30 / intervallEffektiv
    : 0
  // Salz pro Regeneration: Simplex = Gesamtharz, Duplex = 1 Flasche (Katalogwert),
  // Parallel = beide Tanks (Katalogwert = Gesamt) – anlage.harz passt in allen Fällen.
  const salzProRegen = anlage.harz * SALZ_PRO_LITER_HARZ
  const salzMonat = regenProMonat * salzProRegen
  const salzJahr = salzMonat * 12
  const kostenJahr = salzJahr * salzkostenProKg
  return { intervallNatuerlich, intervallEffektiv, zwangsregeneration, regenProMonat, salzProRegen, salzMonat, salzJahr, kostenJahr }
}

// Anlagenempfehlung: passende Anlage aus Katalog finden.
// Hydraulisches Kriterium = Filtergeschwindigkeit im Betrieb je Modus:
//   robust  → v ≤ 40 m/h (Grünbereich, entspricht dem bisherigen Spitzendurchfluss-Filter)
//   kompakt → v ≤ 75 m/h (bis Gelbgrenze, Grünbeck-Prinzip: kleinere Flasche zulässig)
function findePassendeAnlage(
  anlagentyp: AnlagenTyp,
  harzmengeProFlasche: number,
  volumenstromEnthaerterLMin: number,
  modus: Modus,
): { empfohlen: Anlage | null; alternativen: Anlage[] } {
  const vMax = AUTO_AUSWAHL_V_MAX[modus]
  const passend = ANLAGEN_KATALOG
    .filter(a => a.betriebsart === anlagentyp)
    // Harzmenge der Anlage muss >= berechnete Harzmenge sein
    .filter(a => a.harz >= harzmengeProFlasche)
    // Filtergeschwindigkeit im Betrieb: v = 6·Q/A, Q pro Flasche (Parallel: VE/2)
    .filter(a => {
      const qProFlasche = a.betriebsart === 'parallel' ? volumenstromEnthaerterLMin / 2 : volumenstromEnthaerterLMin
      return (6 * qProFlasche) / a.querschnitt <= vMax
    })
    // Parallelverteiler-Limit bleibt hartes Kriterium
    .filter(a => a.maxAnschlussFluss == null || volumenstromEnthaerterLMin <= a.maxAnschlussFluss)
    // Sortieren: kleinste passende zuerst (nach Harzvolumen)
    .sort((a, b) => a.harz - b.harz || a.durchflussSpitze - b.durchflussSpitze)

  return {
    empfohlen: passend[0] ?? null,
    alternativen: passend.slice(1, 3), // bis zu 2 Alternativen
  }
}

export interface Ergebnisse {
  // Volumenstrom & Gleichzeitigkeit
  spitzenvolumenstrom: number    // l/s – V1 (effektiv verwendet)
  v1AutoWert: number             // l/s – V1 aus BW (immer berechnet)
  v1Quelle: 'auto' | 'manuell'
  volumenstromEnthaerter: number // l/s – VE
  druckverlust: number           // bar – ΔpE
  // Harzmenge
  harzmengeGesamt: number        // Liter (Gesamtharz im System)
  harzmengeProFlasche: number    // Liter (pro einzelne Flasche)
  anzahlFlaschen: number
  // Regeneration
  regenIntervallProFlasche: number // Tage
  regenAmpel: 'gruen' | 'gelb' | 'rot'
  tagesbedarfKapazitaet: number  // °dH·m³/Tag – für anlagenbezogene Intervallberechnung
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
  // Anschluss / Parallelverteiler
  anschluss: AnschlussGroesse
  plausiCheck1: string | null
  // Einstellungen (Passthrough für Anzeige & anlagenbezogene Neuberechnung)
  haerteEinheit: HaerteEinheit
  waehrung: Waehrung
  maxRegenIntervall: number
  salzkostenProKg: number
  modus: Modus
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
export const HARZ_KAPAZITAET = 5.0 // °dH·m³/l Harz

// Natriumzunahme pro °dH Enthärtung: ca. 8.2 mg/l Na+ pro °dH (Stöchiometrie Ionentausch)
const NATRIUM_PRO_DH = 8.2

// Salzverbrauch pro Liter Harz bei Regeneration: ca. 0.15 kg NaCl (Vollbesalzung)
export const SALZ_PRO_LITER_HARZ = 0.15

// Schwelle für Duplex-Empfehlung: ab >20 Personen
const DUPLEX_EMPFEHLUNG_PERSONEN = 20

export function berechne(e: Eingaben): Ergebnisse {
  // Härte intern immer in °dH rechnen (Eingabe wahlweise °dH oder °fH)
  const rohwasserhaerte = e.haerteEinheit === 'fH' ? fhToDh(e.rohwasserhaerte) : e.rohwasserhaerte
  const resthaerte = e.haerteEinheit === 'fH' ? fhToDh(e.resthaerte) : e.resthaerte

  // Grunddaten
  const tagesverbrauch = e.personen * e.verbrauchProPerson // Liter/Tag

  // Verschneidung: Anteil Weichwasser (0°dH nach Austauscher) und Rohwasser
  // Resthärte = rohwasserAnteil × rohwasserhärte + weichwasserAnteil × 0
  // → weichwasserAnteil = 1 - (resthaerte / rohwasserhaerte)
  const weichwasserAnteil = rohwasserhaerte > 0
    ? Math.max(0, Math.min(1, 1 - resthaerte / rohwasserhaerte))
    : 0
  const rohwasserAnteil = 1 - weichwasserAnteil

  // Durch Enthärter fliessende Wassermenge pro Tag
  const durchEnthaerter = tagesverbrauch * weichwasserAnteil

  // Volumenstrom (SVGW W3) – immer berechnen als Referenzwert
  const v1AutoWert = spitzenvolumenstromW3(e.bwLu)
  // Effektiver V1: Auto (aus BW) oder manuell (lt. Schema)
  const spitzenvolumenstrom = e.v1Auto ? v1AutoWert : (e.v1Manuell > 0 ? e.v1Manuell : v1AutoWert)
  const v1Quelle: 'auto' | 'manuell' = e.v1Auto ? 'auto' : 'manuell'
  // VE: Anteil des Volumenstroms, der durch Enthärter fliesst
  const volumenstromEnthaerter = spitzenvolumenstrom * weichwasserAnteil

  // Druckverlust: Bett-Formel für die konkrete Anlage – wird nach dem
  // Katalog-Matching berechnet (braucht Betthöhe der empfohlenen Anlage).

  // ── Harzmenge ──────────────────────────────────────────────────────────────
  // Benötigte Kapazität für einen Regenerationszyklus INKL. Tagesreserve:
  // Mengengesteuerte Anlagen regenerieren, bevor das Harz erschöpft ist –
  // die Restkapazität muss den laufenden Tag noch abdecken (Standard: +1 Tag).
  const zyklusTage = e.regenIntervallTage + Math.max(0, e.reserveTage)
  const durchEnthaerterProZyklus = durchEnthaerter * zyklusTage // Liter
  const benoetigteKapazitaet = (durchEnthaerterProZyklus / 1000) * rohwasserhaerte // °dH·m³

  // Harzvolumen für einen vollen Zyklus
  const harzFuerEinenZyklus = benoetigteKapazitaet / HARZ_KAPAZITAET // Liter

  let harzmengeProFlasche: number
  let harzmengeGesamt: number
  let anzahlFlaschen: number

  if (e.anlagentyp === 'simplex') {
    // Simplex: 1 Flasche, muss vollen Zyklus allein abdecken
    anzahlFlaschen = 1
    harzmengeProFlasche = Math.ceil(harzFuerEinenZyklus * 10) / 10
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
  const tagesbedarf = (durchEnthaerter / 1000) * rohwasserhaerte // °dH·m³ pro Tag

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
  // Zwangsregeneration kappt das Intervall (Trinkwasser-Hygiene)
  const maxIntervall = e.maxRegenIntervall > 0 ? e.maxRegenIntervall : Infinity
  const intervallFuerSalz = Math.min(regenIntervallProFlasche, maxIntervall)
  const regenProMonat = intervallFuerSalz > 0 && isFinite(intervallFuerSalz)
    ? 30 / intervallFuerSalz
    : 0
  // Bei Parallel wird die gesamte Harzmenge regeneriert (beide Tanks)
  const salzProRegen = (e.anlagentyp === 'parallel' ? harzmengeGesamt : harzmengeProFlasche) * SALZ_PRO_LITER_HARZ // kg
  const salzverbrauchMonat = regenProMonat * salzProRegen
  const salzverbrauchJahr = salzverbrauchMonat * 12
  const betriebskostenJahr = salzverbrauchJahr * e.salzkosten

  // ── Natrium (Sicherheit, Grenzwert 200 mg/l gemäss TBDV/WHO) ──────────────
  const natriumImWeichwasser = e.natriumRohwasser + rohwasserhaerte * NATRIUM_PRO_DH
  // Nach Verschneidung
  const natriumNachEnthaertung = natriumImWeichwasser * weichwasserAnteil
    + e.natriumRohwasser * rohwasserAnteil

  // ── Anlagentyp-Empfehlung ──────────────────────────────────────────────────
  const anlagentypEmpfehlung = e.personen > DUPLEX_EMPFEHLUNG_PERSONEN
    ? 'Parallel-Anlage empfohlen: Ab ' + DUPLEX_EMPFEHLUNG_PERSONEN + ' Personen empfehlen wir eine Parallel-Anlage – doppelter Durchfluss durch 2 gleichzeitig durchströmte Tanks bei halbem Druckverlust.'
    : 'Simplex-Anlage ausreichend: Regeneration kann in Schwachlastzeiten (z.B. nachts) programmiert werden.'

  // ── Empfehlungstext ────────────────────────────────────────────────────────
  const typText = e.anlagentyp === 'simplex'
    ? 'Simplex-Anlage (1 Harzflasche)'
    : e.anlagentyp === 'duplex'
      ? 'Duplex-Anlage (2 Flaschen, Pendelbetrieb)'
      : 'Parallel-Anlage (2 Tanks, gleichzeitig durchströmt)'

  // ── Anlagenvorschlag aus Produktkatalog ──────────────────────────────────
  const volumenstromEnthaerterLMin = volumenstromEnthaerter * 60 // l/s → l/min
  // Parallel: Katalog-Harz = Gesamtharz (beide Tanks), daher mit harzmengeGesamt matchen
  // Simplex/Duplex: Katalog-Harz = Harz pro Flasche
  const harzFuerMatching = e.anlagentyp === 'parallel' ? harzmengeGesamt : harzmengeProFlasche
  const { empfohlen: empfohleneAnlage, alternativen: alternativeAnlagen } =
    findePassendeAnlage(e.anlagentyp, harzFuerMatching, volumenstromEnthaerterLMin, e.modus)

  // Δp bei der TATSÄCHLICHEN Betriebsgeschwindigkeit der empfohlenen Anlage
  const druckverlust = empfohleneAnlage && volumenstromEnthaerter > 0
    ? druckverlustFuerAnlage(empfohleneAnlage, volumenstromEnthaerter)
    : 0

  // ── Empfehlungstext (nutzt Anlagen-Harzwerte wenn verfügbar) ─────────────
  const anlageHarz = empfohleneAnlage ? empfohleneAnlage.harz : harzmengeGesamt
  const anlageHarzProTank = empfohleneAnlage?.harzProTank
  const anlageName = empfohleneAnlage ? empfohleneAnlage.name : null

  let harzText = `Gesamtes Harzvolumen: ${anlageHarz} Liter`
  if (anlageHarzProTank != null) {
    harzText += ` (2 Tanks × ${anlageHarzProTank} Liter)`
  } else if (anzahlFlaschen === 2) {
    harzText += ` (2 × ${(anlageHarz / 2).toFixed(1)} Liter)`
  }
  harzText += '.'

  const empfehlung = [
    `Empfohlene Konfiguration: ${typText}${anlageName ? ` – ${anlageName}` : ''}.`,
    harzText,
    `Regenerationsintervall: ca. ${Math.min(regenIntervallProFlasche, 999).toFixed(1)} Tage.`,
    `Salzvorrat: ca. ${salzverbrauchMonat.toFixed(1)} kg/Monat (${salzverbrauchJahr.toFixed(0)} kg/Jahr).`,
    regenAmpel === 'rot'
      ? '⚠ Kritisch: Regenerationsintervall unter 1 Tag – grössere Anlage oder weniger Personen empfohlen.'
      : regenAmpel === 'gelb'
        ? 'Hinweis: Regenerationsintervall knapp – Anlage prüfen.'
        : 'Regenerationsintervall im optimalen Bereich.',
  ].join('\n')

  // ── Plausi-Check 1: Hauptleitung vs. V1 ─────────────────────────────────
  let plausiCheck1: string | null = null
  if (e.anschluss) {
    const maxFluss = ANSCHLUSS_MAX_DURCHFLUSS[e.anschluss]
    if (maxFluss && spitzenvolumenstrom > maxFluss) {
      plausiCheck1 = `Achtung: Gebäude-Spitzenvolumenstrom (V1 = ${spitzenvolumenstrom.toFixed(3)} l/s) übersteigt den gewählten Anschluss (${e.anschluss} → max ~${maxFluss} l/s). Grössere Hauptleitung prüfen.`
    }
  }

  return {
    spitzenvolumenstrom,
    v1AutoWert,
    v1Quelle,
    volumenstromEnthaerter,
    druckverlust,
    anschluss: e.anschluss,
    plausiCheck1,
    haerteEinheit: e.haerteEinheit,
    waehrung: e.waehrung,
    maxRegenIntervall: e.maxRegenIntervall,
    salzkostenProKg: e.salzkosten,
    modus: e.modus,
    harzmengeGesamt: Math.max(0, harzmengeGesamt),
    harzmengeProFlasche: Math.max(0, harzmengeProFlasche),
    anzahlFlaschen,
    regenIntervallProFlasche: Math.min(regenIntervallProFlasche, 999),
    regenAmpel,
    tagesbedarfKapazitaet: tagesbedarf,
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
