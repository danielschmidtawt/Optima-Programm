// ── pH-Optima Konfiguration V1 – Berechnungsmodul ──────────────────────────
// Alle Berechnungen für Ionenaustauscher-Enthärtungsanlagen

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

export interface Ergebnisse {
  // Volumenstrom & Gleichzeitigkeit
  spitzenvolumenstrom: number    // l/s – V1 aus BW
  volumenstromEnthaerter: number // l/s – VE
  druckverlust: number           // bar – ΔpE
  // Parallel-Spezial
  veProFlascheNormal: number     // l/s – VE/2 pro Flasche (Normalbetrieb)
  veRegenModus: number           // l/s – VE voll auf 1 Flasche
  // Harzmenge
  harzmengeGesamt: number        // Liter
  harzmengeProFlasche: number    // Liter
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
}

// SVGW W3 Diagramm 1: Spitzenvolumenstrom aus BW
// Vereinfachte Formel: V1 = 0.0682 * BW^0.535 (Approximation der W3-Kurve)
function spitzenvolumenstromW3(bw: number): number {
  if (bw <= 0) return 0
  return 0.0682 * Math.pow(bw, 0.535)
}

// Spezifische Harzkapazität: ca. 5.0 °dH·m³ pro Liter Harz (Standardwert Kationenaustauscher)
const HARZ_KAPAZITAET = 5.0 // °dH·m³/l Harz

// Natriumzunahme pro °dH Enthärtung: ca. 8.2 mg/l Na+ pro °dH
const NATRIUM_PRO_DH = 8.2

// Salzverbrauch pro Liter Harz bei Regeneration: ca. 0.15 kg NaCl
const SALZ_PRO_LITER_HARZ = 0.15

export function berechne(e: Eingaben): Ergebnisse {
  // Grunddaten
  const tagesverbrauch = e.personen * e.verbrauchProPerson // Liter/Tag

  // Verschneidung: Anteil Weichwasser (0°dH nach Austauscher) und Rohwasser
  // Resthärte = rohwasserAnteil * rohwasserhärte + weichwasserAnteil * 0
  // weichwasserAnteil = 1 - (resthaerte / rohwasserhaerte)
  const weichwasserAnteil = e.rohwasserhaerte > 0
    ? Math.max(0, Math.min(1, 1 - e.resthaerte / e.rohwasserhaerte))
    : 0
  const rohwasserAnteil = 1 - weichwasserAnteil

  // Durch Enthärter fliessende Wassermenge pro Tag
  const durchEnthaerter = tagesverbrauch * weichwasserAnteil

  // Volumenstrom
  const spitzenvolumenstrom = spitzenvolumenstromW3(e.bwLu)
  // VE: Anteil des Volumenstroms, der durch Enthärter fliesst
  const volumenstromEnthaerter = spitzenvolumenstrom * weichwasserAnteil

  // Druckverlust (vereinfacht proportional zum Quadrat des Volumenstroms)
  const vaRef = e.volumenstromApparat
  const dpRef = e.druckverlustApparat
  let druckverlust = 0
  if (vaRef > 0) {
    if (e.anlagentyp === 'parallel') {
      // Im Normalbetrieb: halber Volumenstrom pro Flasche → deutlich weniger Druckverlust
      const veProFlasche = volumenstromEnthaerter / 2
      druckverlust = dpRef * Math.pow(veProFlasche / vaRef, 2)
    } else {
      druckverlust = dpRef * Math.pow(volumenstromEnthaerter / vaRef, 2)
    }
  }

  // Parallel: spezielle Werte
  const veProFlascheNormal = volumenstromEnthaerter / 2
  const veRegenModus = volumenstromEnthaerter

  // Harzmenge
  // Kapazität pro Liter Harz = HARZ_KAPAZITAET °dH·m³
  // Benötigte Kapazität = durchEnthaerter_pro_Zyklus * rohwasserhärte / 1000 (m³)
  // durchEnthaerter_pro_Zyklus = durchEnthaerter * regenIntervallTage
  const durchEnthaerterProZyklus = durchEnthaerter * e.regenIntervallTage // Liter
  const benoetigteKapazitaet = (durchEnthaerterProZyklus / 1000) * e.rohwasserhaerte // °dH·m³

  let harzmengeGesamt: number
  let anzahlFlaschen: number

  if (e.anlagentyp === 'simplex') {
    harzmengeGesamt = benoetigteKapazitaet / HARZ_KAPAZITAET
    anzahlFlaschen = 1
  } else {
    // Duplex/Parallel: Jede Flasche muss allein den vollen Bedarf abdecken können
    // Bei Duplex: abwechselnd, jede Flasche muss einen vollen Zyklus abdecken
    // Bei Parallel: bei Regeneration einer Flasche arbeitet die andere solo
    harzmengeGesamt = benoetigteKapazitaet / HARZ_KAPAZITAET
    anzahlFlaschen = 2
  }

  const harzmengeProFlasche = e.anlagentyp === 'simplex'
    ? harzmengeGesamt
    : Math.ceil(harzmengeGesamt / 2 * 10) / 10 // Aufrunden auf 0.1l pro Flasche

  // Regenerationsintervall pro Flasche (Rückrechnung basierend auf tatsächlicher Kapazität)
  const kapazitaetProFlasche = harzmengeProFlasche * HARZ_KAPAZITAET // °dH·m³
  const tagesbedarf = (durchEnthaerter / 1000) * e.rohwasserhaerte // °dH·m³ pro Tag

  let regenIntervallProFlasche: number
  if (e.anlagentyp === 'simplex') {
    regenIntervallProFlasche = tagesbedarf > 0 ? kapazitaetProFlasche / tagesbedarf : Infinity
  } else {
    // Bei Duplex: Jede Flasche wird abwechselnd genutzt
    // Bei Parallel: Bei Regen einer Flasche übernimmt die andere
    regenIntervallProFlasche = tagesbedarf > 0 ? kapazitaetProFlasche / tagesbedarf : Infinity
  }

  // Ampelsystem
  let regenAmpel: 'gruen' | 'gelb' | 'rot'
  if (regenIntervallProFlasche >= 2) {
    regenAmpel = 'gruen'
  } else if (regenIntervallProFlasche >= 1) {
    regenAmpel = 'gelb'
  } else {
    regenAmpel = 'rot'
  }

  // Salzverbrauch
  const regenProMonat = regenIntervallProFlasche > 0
    ? (30 / regenIntervallProFlasche) * anzahlFlaschen
    : 0
  const salzProRegen = harzmengeProFlasche * SALZ_PRO_LITER_HARZ // kg
  const salzverbrauchMonat = regenProMonat * salzProRegen
  const salzverbrauchJahr = salzverbrauchMonat * 12
  const betriebskostenJahr = salzverbrauchJahr * e.salzkosten

  // Natrium
  // Vollentsalztes Wasser hat: rohwasserNatrium + Enthärtungsnatrium
  const natriumImWeichwasser = e.natriumRohwasser + e.rohwasserhaerte * NATRIUM_PRO_DH
  // Nach Verschneidung
  const natriumNachEnthaertung = natriumImWeichwasser * weichwasserAnteil
    + e.natriumRohwasser * rohwasserAnteil

  // Empfehlung
  const typText = e.anlagentyp === 'simplex'
    ? 'Simplex-Anlage (1 Harzflasche)'
    : e.anlagentyp === 'duplex'
      ? 'Duplex-Anlage (2 Flaschen, Pendelbetrieb)'
      : 'Parallel-Anlage (2 Flaschen, gleichzeitig durchströmt)'

  const empfehlung = [
    `Empfohlene Konfiguration: ${typText}.`,
    `Gesamtes Harzvolumen: ${harzmengeGesamt.toFixed(1)} Liter` +
      (anzahlFlaschen === 2 ? ` (2 × ${harzmengeProFlasche.toFixed(1)} Liter)` : '') + '.',
    `Regenerationsintervall: ca. ${regenIntervallProFlasche.toFixed(1)} Tage pro Flasche.`,
    `Salzvorrat: ca. ${salzverbrauchMonat.toFixed(1)} kg/Monat (${salzverbrauchJahr.toFixed(0)} kg/Jahr).`,
    regenAmpel === 'rot'
      ? '⚠ Kritisch: Regenerationsintervall unter 1 Tag – grössere Anlage oder weniger Personen empfohlen.'
      : regenAmpel === 'gelb'
        ? 'Hinweis: Regenerationsintervall knapp – Anlage prüfen.'
        : 'Regenerationsintervall im optimalen Bereich.',
  ].join('\n')

  return {
    spitzenvolumenstrom,
    volumenstromEnthaerter,
    druckverlust,
    veProFlascheNormal,
    veRegenModus,
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
  }
}

// Einheitenumrechner
export function dhToFh(dh: number): number { return dh * 1.7848 }
export function fhToDh(fh: number): number { return fh / 1.7848 }
export function dhToMmol(dh: number): number { return dh * 0.1783 }
export function mmolToDh(mmol: number): number { return mmol / 0.1783 }
export function fhToMmol(fh: number): number { return dhToMmol(fhToDh(fh)) }
export function mmolToFh(mmol: number): number { return dhToFh(mmolToDh(mmol)) }
