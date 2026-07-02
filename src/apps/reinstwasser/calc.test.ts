// ── Tests für das Reinstwasser-Berechnungsmodul ──────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  berechneHarz,
  berechneNachspeisung,
  HARZ_DATEN,
  HARZ_GROESSEN,
  GERAETE,
  REFERENZ_LEITWERT,
  NACHSPEISUNG_ANTEIL_PA,
  type HarzEingaben,
  type NachspeisungEingaben,
} from './calc'

const HARZ_BASIS: HarzEingaben = {
  leitwertFrisch: 300,
  mengeFrisch: 500,
  leitwertBestand: 150,
  mengeBestand: 1000,
  harzGroesse: 7,
}

const NACH_BASIS: NachspeisungEingaben = {
  leistungKW: 100,
  pufferLiter: 200,
  fbhVorhanden: false,
  inhaltManuell: 0,
  leitwertNachspeisung: 420,
}

describe('Harz-Kapazität: Misch-Leitwert', () => {
  it('mengengewichteter Mittelwert: 500 l @ 300 + 1000 l @ 150 → 200 µS/cm', () => {
    const r = berechneHarz(HARZ_BASIS)
    expect(r.totalMenge).toBe(1500)
    expect(r.mischLeitwert).toBeCloseTo(200, 5)
  })

  it('nur Frischwasser → Leitwert unverändert', () => {
    const r = berechneHarz({ ...HARZ_BASIS, mengeBestand: 0, leitwertBestand: 0 })
    expect(r.mischLeitwert).toBeCloseTo(300, 5)
  })

  it('keine Menge → keine Bedarfe, kein Fehler', () => {
    const r = berechneHarz({ ...HARZ_BASIS, mengeFrisch: 0, mengeBestand: 0 })
    expect(r.bedarfLiterGesamt).toBe(0)
    expect(r.bedarfEinheiten).toBe(0)
  })
})

describe('Harz-Kapazität: Bedarf', () => {
  it('Bedarf skaliert mit Leitwert: 1500 l @ 200 µS auf 7-l-Harz ≈ 4.58 l', () => {
    const r = berechneHarz(HARZ_BASIS)
    // 1500 / (155.79 × 420/200) = 4.585 l
    expect(r.bedarfLiterGesamt).toBeCloseTo(4.585, 2)
    expect(r.bedarfEinheiten).toBe(1)
  })

  it('beim Referenz-Leitwert 420 entspricht die Kapazität dem Katalogwert', () => {
    const r = berechneHarz({
      leitwertFrisch: REFERENZ_LEITWERT, mengeFrisch: 3000,
      leitwertBestand: 0, mengeBestand: 0, harzGroesse: 7,
    })
    // 3000 / 155.79 = 19.257 l → 3 Einheiten à 7 l
    expect(r.bedarfLiterGesamt).toBeCloseTo(3000 / 155.79, 3)
    expect(r.bedarfEinheiten).toBe(3)
  })

  it('doppelter Leitwert → doppelter Harzbedarf', () => {
    const lf420 = berechneHarz({ ...HARZ_BASIS, leitwertFrisch: 420, mengeFrisch: 1000, mengeBestand: 0 })
    const lf840 = berechneHarz({ ...HARZ_BASIS, leitwertFrisch: 840, mengeFrisch: 1000, mengeBestand: 0 })
    expect(lf840.bedarfLiterGesamt).toBeCloseTo(lf420.bedarfLiterGesamt * 2, 5)
  })

  it('Einheiten werden immer aufgerundet', () => {
    const r = berechneHarz({
      leitwertFrisch: 420, mengeFrisch: 1200,
      leitwertBestand: 0, mengeBestand: 0, harzGroesse: 7,
    })
    // 1200/155.79 = 7.70 l → ceil(7.70/7) = 2
    expect(r.bedarfEinheiten).toBe(2)
  })

  it('unbekannte Harzgrösse → Nullwerte statt Absturz', () => {
    const r = berechneHarz({ ...HARZ_BASIS, harzGroesse: 99 })
    expect(r.bedarfLiterGesamt).toBe(0)
    expect(r.bedarfEinheiten).toBe(0)
  })

  it('alle Katalog-Harzgrössen haben Kapazitätsdaten', () => {
    for (const g of HARZ_GROESSEN) {
      expect(HARZ_DATEN[String(g)]).toBeDefined()
      expect(HARZ_DATEN[String(g)].kapazitaet).toBeGreaterThan(100)
    }
  })
})

describe('Nachspeisung: Anlageninhalt', () => {
  it('Radiatoren: 13 l/kW + Puffer (100 kW + 200 l = 1500 l)', () => {
    const r = berechneNachspeisung(NACH_BASIS)
    expect(r.anlageninhalt).toBe(1500)
  })

  it('Fussbodenheizung: 25 l/kW (100 kW + 200 l = 2700 l)', () => {
    const r = berechneNachspeisung({ ...NACH_BASIS, fbhVorhanden: true })
    expect(r.anlageninhalt).toBe(2700)
  })

  it('manueller Inhalt überschreibt die kW-Berechnung', () => {
    const r = berechneNachspeisung({ ...NACH_BASIS, inhaltManuell: 5000 })
    expect(r.anlageninhalt).toBe(5000)
    expect(r.nachspeisungPA).toBeCloseTo(150, 5)
  })

  it('Nachspeisung = 3 % des Inhalts pro Jahr', () => {
    const r = berechneNachspeisung(NACH_BASIS)
    expect(r.nachspeisungPA).toBeCloseTo(1500 * NACHSPEISUNG_ANTEIL_PA, 5)
  })
})

describe('Nachspeisung: Geräteauswahl MH10/MH20/MH40/M+', () => {
  function mitJahresbedarf(literProJahr: number, leitwert = 420) {
    // PA = inhalt × 0.03 → inhalt = PA / 0.03
    return berechneNachspeisung({
      ...NACH_BASIS,
      inhaltManuell: literProJahr / NACHSPEISUNG_ANTEIL_PA,
      leitwertNachspeisung: leitwert,
    })
  }

  it('kleine Anlage → MH10', () => {
    const r = berechneNachspeisung(NACH_BASIS) // 45 l/Jahr
    expect(r.empfohlenerGeraet.name).toBe('pH-Optima MH10')
    expect(r.ueberKapazitaet).toBe(false)
  })

  it('Grenzwerte bei 420 µS/cm: exakt 1380 → MH10, knapp darüber → MH20', () => {
    expect(mitJahresbedarf(1380).empfohlenerGeraet.name).toBe('pH-Optima MH10')
    expect(mitJahresbedarf(1381).empfohlenerGeraet.name).toBe('pH-Optima MH20')
    expect(mitJahresbedarf(2761).empfohlenerGeraet.name).toBe('pH-Optima MH40')
    expect(mitJahresbedarf(5521).empfohlenerGeraet.name).toBe('pH-Optima M+')
  })

  it('LEITWERT-FIX: bei 840 µS/cm halbiert sich die Gerätekapazität', () => {
    // 700 l/Jahr passt bei 420 µS locker in MH10 (1380) –
    // bei 840 µS kann MH10 real nur noch 690 l → MH20 nötig
    expect(mitJahresbedarf(700, 420).empfohlenerGeraet.name).toBe('pH-Optima MH10')
    expect(mitJahresbedarf(700, 840).empfohlenerGeraet.name).toBe('pH-Optima MH20')
  })

  it('niedriger Leitwert erhöht die Kapazität (210 µS: MH10 schafft 2760 l)', () => {
    expect(mitJahresbedarf(2000, 210).empfohlenerGeraet.name).toBe('pH-Optima MH10')
  })

  it('Überkapazität wird erkannt statt still M+ zu empfehlen', () => {
    const r = mitJahresbedarf(20000)
    expect(r.empfohlenerGeraet.name).toBe('pH-Optima M+')
    expect(r.ueberKapazitaet).toBe(true)
  })

  it('Reichweite: MH10 mit 45 l/Jahr hält ~30 Jahre', () => {
    const r = berechneNachspeisung(NACH_BASIS)
    expect(r.reichweiteJahre).toBeCloseTo(1380 / 45, 1)
  })

  it('Leitwert 0 fällt auf Referenz 420 zurück (kein Division-durch-Null)', () => {
    const r = berechneNachspeisung({ ...NACH_BASIS, leitwertNachspeisung: 0 })
    expect(r.effektiveKapazitaet).toBe(1380)
    expect(Number.isFinite(r.nachspeisungPA)).toBe(true)
  })

  it('Gerätekapazitäten sind aufsteigend gestaffelt', () => {
    for (let i = 1; i < GERAETE.length; i++) {
      expect(GERAETE[i].maxLiter).toBeGreaterThan(GERAETE[i - 1].maxLiter)
    }
  })
})
