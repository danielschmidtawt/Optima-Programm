// ── Tests für das Berechnungsmodul ──────────────────────────────────────────
// Referenzfall (herstellervalidiert): 96 Personen, 15.5 → 8.2 °dH,
// Parallel-Anlage → pH-Optima MFH 50/2xWS1-CK (Art.Nr. 4430)

import { describe, it, expect } from 'vitest'
import {
  berechne,
  pruefeFlussProKopf,
  intervallFuerAnlage,
  ampelFuerIntervall,
  kopfgroesse,
  ANLAGEN_KATALOG,
  ANSCHLUSS_MAX_DURCHFLUSS,
  HARZ_KAPAZITAET,
  type Eingaben,
  type Anlage,
} from './calc'

const BASIS: Eingaben = {
  projektname: 'Test',
  bearbeiter: 'Test',
  rohwasserhaerte: 25,
  resthaerte: 5,
  personen: 4,
  bwLu: 4 * 2.94,
  bwAuto: true,
  anlagentyp: 'duplex',
  anschluss: '',
  v1Auto: true,
  v1Manuell: 0,
  verbrauchProPerson: 150,
  regenIntervallTage: 3,
  reserveTage: 1,
  natriumRohwasser: 5,
  salzkosten: 0.6,
  volumenstromApparat: 0.7,
  druckverlustApparat: 1.0,
  bwProPerson: 2.94,
}

function anlage(artNr: string): Anlage {
  const a = ANLAGEN_KATALOG.find(x => x.artNr === artNr)
  if (!a) throw new Error(`Anlage ${artNr} nicht im Katalog`)
  return a
}

describe('Verschneidung', () => {
  it('berechnet Weichwasseranteil aus Roh- und Resthärte (25 → 5 °dH = 80 %)', () => {
    const r = berechne(BASIS)
    expect(r.weichwasserAnteil).toBeCloseTo(80, 5)
    expect(r.rohwasserAnteil).toBeCloseTo(20, 5)
  })

  it('Resthärte ≥ Rohwasserhärte → 0 % Weichwasser, kein Salzverbrauch', () => {
    const r = berechne({ ...BASIS, resthaerte: 30 })
    expect(r.weichwasserAnteil).toBe(0)
    expect(r.volumenstromEnthaerter).toBe(0)
    expect(r.salzverbrauchMonat).toBe(0)
  })

  it('Rohwasserhärte 0 → keine Division durch Null', () => {
    const r = berechne({ ...BASIS, rohwasserhaerte: 0 })
    expect(r.weichwasserAnteil).toBe(0)
    expect(Number.isFinite(r.natriumNachEnthaertung)).toBe(true)
  })
})

describe('Spitzenvolumenstrom V1 (SVGW W3)', () => {
  it('berechnet V1 aus BW: 4 Personen (BW 11.76) ≈ 0.255 l/s', () => {
    const r = berechne(BASIS)
    expect(r.spitzenvolumenstrom).toBeCloseTo(0.255, 3)
    expect(r.v1Quelle).toBe('auto')
  })

  it('manueller V1 ersetzt NUR den hydraulischen Pfad, Kapazität bleibt personenbasiert', () => {
    const auto = berechne(BASIS)
    const manuell = berechne({ ...BASIS, v1Auto: false, v1Manuell: 1.5 })
    // Hydraulik folgt manuellem V1
    expect(manuell.spitzenvolumenstrom).toBe(1.5)
    expect(manuell.v1Quelle).toBe('manuell')
    expect(manuell.volumenstromEnthaerter).toBeCloseTo(1.2, 5) // 1.5 × 0.8
    // Kapazitätsseite unverändert (personenbasiert)
    expect(manuell.tagesverbrauch).toBe(auto.tagesverbrauch)
    expect(manuell.harzmengeProFlasche).toBe(auto.harzmengeProFlasche)
    expect(manuell.salzverbrauchMonat).toBeCloseTo(auto.salzverbrauchMonat, 6)
  })

  it('manueller V1 = 0 fällt auf Auto-Wert zurück', () => {
    const r = berechne({ ...BASIS, v1Auto: false, v1Manuell: 0 })
    expect(r.spitzenvolumenstrom).toBeCloseTo(0.255, 3)
  })
})

describe('Harzmenge mit Kapazitätsreserve', () => {
  it('Duplex 4 Personen: (3+1) Tage × 480 l × 25 °dH / 5 = 9.6 l pro Flasche', () => {
    const r = berechne(BASIS)
    expect(r.harzmengeProFlasche).toBeCloseTo(9.6, 5)
    expect(r.harzmengeGesamt).toBeCloseTo(19.2, 5)
    expect(r.anzahlFlaschen).toBe(2)
  })

  it('ohne Reserve (reserveTage 0) entsprechend kleiner: 7.2 l pro Flasche', () => {
    const r = berechne({ ...BASIS, reserveTage: 0 })
    expect(r.harzmengeProFlasche).toBeCloseTo(7.2, 5)
  })

  it('Simplex: 1 Flasche mit vollem Zyklusharz', () => {
    const r = berechne({ ...BASIS, anlagentyp: 'simplex' })
    expect(r.anzahlFlaschen).toBe(1)
    expect(r.harzmengeProFlasche).toBeCloseTo(9.6, 5)
    expect(r.harzmengeGesamt).toBeCloseTo(9.6, 5)
  })

  it('Parallel: Zyklusharz auf 2 Tanks verteilt', () => {
    const r = berechne({ ...BASIS, anlagentyp: 'parallel' })
    expect(r.harzmengeGesamt).toBeCloseTo(9.6, 5)
    expect(r.harzmengeProFlasche).toBeCloseTo(4.8, 5)
  })
})

describe('Anlagenempfehlung (Katalog-Matching)', () => {
  it('4 Personen Duplex → MFH 15/Twin-WS1-CK (Art.Nr. 4398)', () => {
    const r = berechne(BASIS)
    expect(r.empfohleneAnlage?.artNr).toBe('4398')
  })

  it('HERSTELLERVALIDIERT: 96 P, 15.5 → 8.2 °dH, Parallel → MFH 50/2xWS1-CK (4430)', () => {
    const r = berechne({
      ...BASIS,
      personen: 96,
      bwLu: 96 * 2.94,
      rohwasserhaerte: 15.5,
      resthaerte: 8.2,
      anlagentyp: 'parallel',
    })
    expect(r.empfohleneAnlage?.artNr).toBe('4430')
    expect(r.empfohleneAnlage?.name).toBe('pH-Optima MFH 50/2xWS1-CK')
  })

  it('OHNE Tagesreserve wäre der Herstellerfall eine Nummer zu klein (Bug-Beleg)', () => {
    const r = berechne({
      ...BASIS,
      personen: 96,
      bwLu: 96 * 2.94,
      rohwasserhaerte: 15.5,
      resthaerte: 8.2,
      anlagentyp: 'parallel',
      reserveTage: 0,
    })
    expect(r.empfohleneAnlage?.artNr).toBe('4429') // MFH 40/2x – zu klein
  })

  it('manueller V1 treibt die hydraulische Auswahl: Simplex mit V1 = 1.5 l/s → MFH 150/WS1,5', () => {
    const r = berechne({ ...BASIS, anlagentyp: 'simplex', v1Auto: false, v1Manuell: 1.5 })
    // VE = 72 l/min → kleinste Einzelanlage mit Spitze ≥ 72 ist MFH 150/WS1,5 (86.5)
    expect(r.empfohleneAnlage?.artNr).toBe('4418')
  })

  it('Duplex mit hohem manuellem V1: keine Twin-Anlage schafft 72 l/min → Sonderlösung', () => {
    const r = berechne({ ...BASIS, v1Auto: false, v1Manuell: 1.5 })
    expect(r.empfohleneAnlage).toBeNull()
  })

  it('Empfehlung erfüllt immer Harz- UND Durchflussbedarf', () => {
    for (const personen of [2, 8, 20, 40, 80, 120]) {
      for (const typ of ['simplex', 'duplex', 'parallel'] as const) {
        const r = berechne({ ...BASIS, personen, bwLu: personen * 2.94, anlagentyp: typ })
        if (r.empfohleneAnlage) {
          const harzBedarf = typ === 'parallel' ? r.harzmengeGesamt : r.harzmengeProFlasche
          expect(r.empfohleneAnlage.harz).toBeGreaterThanOrEqual(harzBedarf)
          expect(r.empfohleneAnlage.durchflussSpitze).toBeGreaterThanOrEqual(r.volumenstromEnthaerter * 60)
        }
      }
    }
  })
})

describe('Regenerationsintervall & Salz', () => {
  it('Mindestharz-Intervall = Intervall + Reserve (4 Personen: 4 Tage)', () => {
    const r = berechne(BASIS)
    expect(r.regenIntervallProFlasche).toBeCloseTo(4, 5)
    expect(r.tagesbedarfKapazitaet).toBeCloseTo(12, 5) // 480 l × 25 °dH / 1000
  })

  it('intervallFuerAnlage: Twin 15 l bei 12 °dH·m³/Tag → 6.25 Tage', () => {
    expect(intervallFuerAnlage(anlage('4398'), 12)).toBeCloseTo(6.25, 5)
  })

  it('ampelFuerIntervall: ≥2 grün, ≥1 gelb, sonst rot', () => {
    expect(ampelFuerIntervall(4)).toBe('gruen')
    expect(ampelFuerIntervall(1.5)).toBe('gelb')
    expect(ampelFuerIntervall(0.5)).toBe('rot')
  })

  it('Salzverbrauch Duplex: 30/4 Regen × 9.6 l × 0.15 kg = 10.8 kg/Monat', () => {
    const r = berechne(BASIS)
    expect(r.salzverbrauchMonat).toBeCloseTo(10.8, 4)
    expect(r.salzverbrauchJahr).toBeCloseTo(129.6, 3)
  })
})

describe('Natrium (TBDV/WHO 200 mg/l)', () => {
  it('berechnet Natrium nach Verschneidung: 169 mg/l bei Basisfall', () => {
    const r = berechne(BASIS)
    // (5 + 25 × 8.2) × 0.8 + 5 × 0.2 = 169
    expect(r.natriumNachEnthaertung).toBeCloseTo(169, 4)
    expect(r.natriumWarnung).toBe(false)
  })

  it('warnt über 200 mg/l', () => {
    const r = berechne({ ...BASIS, rohwasserhaerte: 40, resthaerte: 2 })
    expect(r.natriumNachEnthaertung).toBeGreaterThan(200)
    expect(r.natriumWarnung).toBe(true)
  })
})

describe('Plausi-Check 1: Hauptleitung vs. V1', () => {
  it('warnt wenn V1 den Anschluss übersteigt (1" bei 1.5 l/s)', () => {
    const r = berechne({ ...BASIS, anschluss: '1"', v1Auto: false, v1Manuell: 1.5 })
    expect(r.plausiCheck1).toContain('übersteigt')
  })

  it('keine Warnung bei ausreichendem Anschluss (2" bei 1.5 l/s)', () => {
    const r = berechne({ ...BASIS, anschluss: '2"', v1Auto: false, v1Manuell: 1.5 })
    expect(r.plausiCheck1).toBeNull()
  })

  it('kein Anschluss gewählt → kein Check, kein Fehler', () => {
    const r = berechne({ ...BASIS, anschluss: '' })
    expect(r.plausiCheck1).toBeNull()
  })

  it('Grenzwerte sind plausibel gestaffelt', () => {
    expect(ANSCHLUSS_MAX_DURCHFLUSS['1"']).toBeLessThan(ANSCHLUSS_MAX_DURCHFLUSS['5/4"'])
    expect(ANSCHLUSS_MAX_DURCHFLUSS['5/4"']).toBeLessThan(ANSCHLUSS_MAX_DURCHFLUSS['1½"'])
    expect(ANSCHLUSS_MAX_DURCHFLUSS['1½"']).toBeLessThan(ANSCHLUSS_MAX_DURCHFLUSS['2"'])
  })
})

describe('Plausi-Check 2: Durchfluss pro Kopf', () => {
  it('Parallel teilt VE auf 2 Köpfe auf', () => {
    // Herstellerfall: VE ≈ 0.657 l/s auf MFH 50/2x
    const p = pruefeFlussProKopf(0.6574, 'parallel', anlage('4430'))
    expect(p.flussProjKopfLMin).toBeCloseTo(19.7, 1)
    expect(p.nennProKopfLMin).toBeCloseTo(16.9, 5)
    expect(p.maxProKopfLMin).toBeCloseTo(33.8, 5)
    expect(p.status).toBe('spitze') // über Nenn, unter Max – zulässig
    expect(p.warnung).toBeNull()
  })

  it('Simplex: voller VE durch einen Kopf, Überlast wird erkannt', () => {
    const p = pruefeFlussProKopf(1.2, 'simplex', anlage('4388')) // 72 l/min auf MFH 15
    expect(p.status).toBe('ueberlast')
    expect(p.warnung).toContain('übersteigt')
  })

  it('Nennbereich wird als ok erkannt', () => {
    const p = pruefeFlussProKopf(0.1, 'simplex', anlage('4397')) // 6 l/min auf MFH 100
    expect(p.status).toBe('ok')
    expect(p.warnung).toBeNull()
  })
})

describe('Kopfgrössen', () => {
  it('Clack-Köpfe sind 5/4" (WS1 & WS1,5), nur WS2 hat 2"', () => {
    expect(kopfgroesse('einzel_1')).toBe('5/4"')
    expect(kopfgroesse('twin_1')).toBe('5/4"')
    expect(kopfgroesse('parallel_1')).toBe('5/4"')
    expect(kopfgroesse('einzel_1_5')).toBe('5/4"')
    expect(kopfgroesse('parallel_1_5')).toBe('5/4"')
    expect(kopfgroesse('einzel_2')).toBe('2"')
  })
})

describe('Katalog-Konsistenz', () => {
  it('Parallel-Anlagen: Gesamtharz = 2 × Harz pro Tank', () => {
    for (const a of ANLAGEN_KATALOG.filter(x => x.betriebsart === 'parallel')) {
      expect(a.harz).toBe((a.harzProTank ?? 0) * 2)
    }
  })

  it('alle Anlagen haben Spitze ≥ Nenndurchfluss und positive Harzmengen', () => {
    for (const a of ANLAGEN_KATALOG) {
      expect(a.durchflussSpitze).toBeGreaterThanOrEqual(a.durchflussNormal)
      expect(a.harz).toBeGreaterThan(0)
    }
  })

  it('Harzkapazität-Konstante im plausiblen Normbereich (4.5–5.5)', () => {
    expect(HARZ_KAPAZITAET).toBeGreaterThanOrEqual(4.5)
    expect(HARZ_KAPAZITAET).toBeLessThanOrEqual(5.5)
  })
})
