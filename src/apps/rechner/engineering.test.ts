// ── Tests Engineering-Modul: Rechenkern, Ampeln, Referenzfälle, Datencheck ───

import { describe, it, expect } from 'vitest'
import {
  velocityMh,
  betthoeheM,
  flussProFlascheLmin,
  druckverlustBar,
  freibordProzent,
  beladungMolProL,
  ampelVelocity,
  ampelDp,
  ampelBett,
  ampelFreibord,
  ampelIntervallEng,
  ampelBeladung,
  ampelNatrium,
  engineeringChecks,
  schlechtesteAmpel,
  pruefeKatalog,
  einordnung,
  V_HARTLIMIT_MH,
  MOL_PRO_DH_M3,
  GRENZWERTE,
  type EngKontext,
} from './engineering'
import {
  berechne, betriebFuerAnlage, dhToFh, ANLAGEN_KATALOG, HARZ_KAPAZITAET, TANK_DATEN,
  DP_KOEFFIZIENT_BAR_PRO_MH_M, DP_VENTIL_BAR,
  type Eingaben, type Anlage,
} from './calc'

function anlage(artNr: string): Anlage {
  const a = ANLAGEN_KATALOG.find(x => x.artNr === artNr)
  if (!a) throw new Error(`Anlage ${artNr} fehlt`)
  return a
}

const BASIS: Eingaben = {
  projektname: '', bearbeiter: '',
  rohwasserhaerte: 25, resthaerte: 5, haerteEinheit: 'dH',
  personen: 4, bwLu: 11.76, bwAuto: true,
  anlagentyp: 'duplex', anschluss: '', modus: 'robust',
  v1Auto: true, v1Manuell: 0,
  verbrauchProPerson: 150, regenIntervallTage: 3, reserveTage: 1, maxRegenIntervall: 4,
  natriumRohwasser: 5, salzkosten: 0.6, waehrung: 'CHF',
  volumenstromApparat: 0.7, druckverlustApparat: 1.0, bwProPerson: 2.94,
}

function kontext(e: ReturnType<typeof berechne>): EngKontext {
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

describe('Rechenkern (reine Funktionen)', () => {
  it('v = 6·Q/A: 33.8 l/min auf 5.067 dm² ≈ 40 m/h', () => {
    expect(velocityMh(33.8, 5.067)).toBeCloseTo(40.02, 1)
  })

  it('Betthöhe = Harz/A/10: 30 l auf 5.067 dm² = 0.592 m', () => {
    expect(betthoeheM(30, 5.067)).toBeCloseTo(0.592, 3)
  })

  it('Durchfluss pro Flasche: Einzel/Pendel = VE, Parallel = VE/2', () => {
    expect(flussProFlascheLmin(1.0, 'simplex')).toBeCloseTo(60, 5)
    expect(flussProFlascheLmin(1.0, 'duplex')).toBeCloseTo(60, 5)
    expect(flussProFlascheLmin(1.0, 'parallel')).toBeCloseTo(30, 5)
  })

  it('Δp = 0.006 × v × Betthöhe + 0.25 (Ventilpauschale)', () => {
    expect(DP_KOEFFIZIENT_BAR_PRO_MH_M).toBe(0.006)
    expect(DP_VENTIL_BAR).toBe(0.25)
    expect(druckverlustBar(60, 1.0)).toBeCloseTo(0.61, 2)  // 60 m/h, 1 m Bett → ~0.4–0.6 gesamt
    expect(druckverlustBar(0, 1.0)).toBe(0)                // kein Fluss → kein Δp
  })

  it('KONTROLL-REFERENZ: 100/Twin bei 31 m/h → ~0.2 bar Bett, ~0.45 bar gesamt', () => {
    const twin100 = anlage('4404') // Tank 1452: A 9.93, 100 l → Betthöhe 1.007 m
    const bett = betthoeheM(100, twin100.querschnitt)
    expect(bett).toBeCloseTo(1.007, 2)
    const dp = druckverlustBar(31, bett)
    expect(dp - DP_VENTIL_BAR).toBeCloseTo(0.19, 1) // Bett-Anteil ~0.2
    expect(dp).toBeCloseTo(0.44, 1)                 // gesamt ~0.45
  })

  it('Freibord = (Innenvolumen − Harz)/Innenvolumen; null nur ohne Tankvolumen', () => {
    expect(freibordProzent(30, undefined)).toBeNull()
    expect(freibordProzent(15, 20.4)).toBeCloseTo(26.47, 1) // Tank 735 mit 15 l Harz
    expect(freibordProzent(40, 48.0)).toBeCloseTo(16.67, 1) // Tank 1044 mit 40 l
  })

  it('Beladung beim natürlichen Intervall = Harzkapazität in mol/l (≈0.89, grün)', () => {
    // intervallNatuerlich = harz×5/tagesbedarf → beladung = 5 × 0.1783
    const beladung = beladungMolProL(12, (15 * HARZ_KAPAZITAET) / 12, 15)
    expect(beladung).toBeCloseTo(HARZ_KAPAZITAET * MOL_PRO_DH_M3, 4)
    expect(ampelBeladung(beladung)).toBe('gruen')
  })
})

describe('Ampel-Grenzen', () => {
  it('Filtergeschwindigkeit modusabhängig; Hartlimit 80 m/h', () => {
    expect(ampelVelocity(39, 'robust')).toBe('gruen')
    expect(ampelVelocity(50, 'robust')).toBe('gelb')
    expect(ampelVelocity(56, 'robust')).toBe('rot')
    expect(ampelVelocity(59, 'kompakt')).toBe('gruen')
    expect(ampelVelocity(70, 'kompakt')).toBe('gelb')
    expect(ampelVelocity(76, 'kompakt')).toBe('rot')
    expect(V_HARTLIMIT_MH).toBe(80)
    expect(ampelVelocity(80.5, 'kompakt')).toBe('rot')
  })

  it('Δp nach Marktbändern: <0.8 gut, 0.8–1.2 ok, >1.2 kritisch', () => {
    expect(ampelDp(0.45, 'robust')).toBe('gruen')
    expect(ampelDp(1.0, 'robust')).toBe('gelb')
    expect(ampelDp(1.3, 'robust')).toBe('rot')
    expect(ampelDp(0.7, 'kompakt')).toBe('gruen')
    expect(ampelDp(1.0, 'kompakt')).toBe('gelb')
    expect(ampelDp(1.25, 'kompakt')).toBe('rot')
  })

  it('Betthöhe: grün 0.6–1.8, gelb bis 0.4/2.2, sonst rot', () => {
    expect(ampelBett(1.0)).toBe('gruen')
    expect(ampelBett(0.5)).toBe('gelb')
    expect(ampelBett(2.0)).toBe('gelb')
    expect(ampelBett(0.3)).toBe('rot')
    expect(ampelBett(2.3)).toBe('rot')
  })

  it('Freibord: grün 15–55, gelb 8–15/55–70, rot <8 oder >70', () => {
    expect(ampelFreibord(30)).toBe('gruen')
    expect(ampelFreibord(10)).toBe('gelb')
    expect(ampelFreibord(60)).toBe('gelb')
    expect(ampelFreibord(5)).toBe('rot')
    expect(ampelFreibord(75)).toBe('rot')
  })

  it('Intervall: grün 1–4, gelb 4–7 / 0.33–1, rot >7 / <0.33', () => {
    expect(ampelIntervallEng(3)).toBe('gruen')
    expect(ampelIntervallEng(5)).toBe('gelb')
    expect(ampelIntervallEng(0.5)).toBe('gelb')
    expect(ampelIntervallEng(8)).toBe('rot')
    expect(ampelIntervallEng(0.2)).toBe('rot')
  })

  it('Natrium: <150 grün, ≤200 gelb, >200 rot', () => {
    expect(ampelNatrium(149)).toBe('gruen')
    expect(ampelNatrium(175)).toBe('gelb')
    expect(ampelNatrium(210)).toBe('rot')
  })
})

describe('REFERENZFALL HAMELI: 95 P, V1 2.0 l/s, 30→15 °fH, Parallel MFH 40/2xWS1', () => {
  const e = berechne({
    ...BASIS,
    personen: 95, bwLu: 95 * 2.94,
    haerteEinheit: 'fH', rohwasserhaerte: 30, resthaerte: 15,
    anlagentyp: 'parallel',
    v1Auto: false, v1Manuell: 2.0,
  })
  const a = anlage('4429') // MFH 40/2xWS1-CK

  it('VE ≈ 1.0 l/s (50 % Verschneidung)', () => {
    expect(e.weichwasserAnteil).toBeCloseTo(50, 3)
    expect(e.volumenstromEnthaerter).toBeCloseTo(1.0, 3)
  })

  it('Filtergeschwindigkeit ≈ 35.6 m/h → grün (robust)', () => {
    const v = velocityMh(flussProFlascheLmin(e.volumenstromEnthaerter, 'parallel'), a.querschnitt)
    expect(v).toBeCloseTo(35.6, 1)
    expect(ampelVelocity(v, 'robust')).toBe('gruen')
  })

  it('Δp ≈ 0.42 bar (Bett-Formel bei tatsächlicher Geschwindigkeit) → GRÜN', () => {
    const v = velocityMh(flussProFlascheLmin(e.volumenstromEnthaerter, 'parallel'), a.querschnitt)
    const dp = druckverlustBar(v, betthoeheM(a.harzProTank!, a.querschnitt))
    expect(dp).toBeCloseTo(0.42, 2)
    expect(ampelDp(dp, 'robust')).toBe('gruen')
    expect(ampelDp(dp, 'kompakt')).toBe('gruen')
  })

  it('Regenerationsintervall ≈ 3.3 Tage → grün', () => {
    const b = betriebFuerAnlage(a, e.tagesbedarfKapazitaet, e.maxRegenIntervall, 0)
    expect(b.intervallNatuerlich).toBeCloseTo(3.34, 2)
    expect(b.zwangsregeneration).toBe(false)
    expect(ampelIntervallEng(b.intervallEffektiv)).toBe('gruen')
  })

  it('°fH-Eingabe entspricht exakt der °dH-Rechnung (30 °fH = 16.81 °dH)', () => {
    const dh = berechne({
      ...BASIS, personen: 95, bwLu: 95 * 2.94,
      haerteEinheit: 'dH', rohwasserhaerte: 30 / 1.7848, resthaerte: 15 / 1.7848,
      anlagentyp: 'parallel', v1Auto: false, v1Manuell: 2.0,
    })
    expect(dhToFh(30 / 1.7848)).toBeCloseTo(30, 5)
    expect(e.tagesbedarfKapazitaet).toBeCloseTo(dh.tagesbedarfKapazitaet, 3)
  })
})

describe('REFERENZFALL Niederrohrdorf: 20 P, V1 4.32 m³/h (1.2 l/s), 21→6 °dH', () => {
  const eingaben: Eingaben = {
    ...BASIS,
    personen: 20, bwLu: 20 * 2.94,
    rohwasserhaerte: 21, resthaerte: 6,
    v1Auto: false, v1Manuell: 1.2,
  }

  it('VE ≈ 0.857 l/s (71.4 % Verschneidung)', () => {
    const e = berechne(eingaben)
    expect(e.volumenstromEnthaerter).toBeCloseTo(0.857, 3)
  })

  it('Pendel Ø10" (Twin 40/50): v ≈ 61 m/h → kompakt gelb, robust rot; Δp plausibel <1 bar', () => {
    const e = berechne(eingaben)
    const twin50 = anlage('4402')
    const v = velocityMh(flussProFlascheLmin(e.volumenstromEnthaerter, 'duplex'), twin50.querschnitt)
    expect(v).toBeCloseTo(61.0, 1)
    expect(ampelVelocity(v, 'kompakt')).toBe('gelb')  // knapp über Grüngrenze 60
    expect(ampelVelocity(v, 'robust')).toBe('rot')    // über Gelbgrenze 55
    // Δp mit Bett-Formel: Twin 50 (0.99 m Bett) bei 61 m/h → ~0.61 bar (vorher fälschlich 1.5)
    const dp = druckverlustBar(v, betthoeheM(50, twin50.querschnitt))
    expect(dp).toBeCloseTo(0.61, 2)
    expect(dp).toBeLessThan(1.0)
  })

  it('Parallel 2×40 l: v ≈ 30.5 m/h → grün', () => {
    const e = berechne({ ...eingaben, anlagentyp: 'parallel' })
    const p40 = anlage('4429')
    const v = velocityMh(flussProFlascheLmin(e.volumenstromEnthaerter, 'parallel'), p40.querschnitt)
    expect(v).toBeCloseTo(30.5, 1)
    expect(ampelVelocity(v, 'robust')).toBe('gruen')
  })

  it('AUTO-AUSWAHL: robust → Twin 75 (Ø13", v 36 grün), kompakt → Twin 40 (Grünbeck-Prinzip)', () => {
    const robust = berechne({ ...eingaben, modus: 'robust' })
    const kompakt = berechne({ ...eingaben, modus: 'kompakt' })
    // Nach dem 4403-Fix (Tank 1354/13") ist Twin 75 die kleinste robuste Wahl
    expect(robust.empfohleneAnlage?.artNr).toBe('4403')
    expect(kompakt.empfohleneAnlage?.artNr).toBe('4401') // MFH 40/Twin, v ≈ 61 m/h (gelb zulässig)
  })
})

describe('Engineering-Checks (Teil B, komplett)', () => {
  it('liefert alle 9 Parameter; Freibord aus Herstellerdaten gefüllt (KEINE Datenlücke)', () => {
    const e = berechne(BASIS)
    const checks = engineeringChecks(anlage('4398'), kontext(e))
    expect(checks.map(c => c.key)).toEqual([
      'velocity', 'dp', 'bett', 'freibord', 'intervall', 'beladung', 'natrium', 'ventil', 'anschluss',
    ])
    const freibord = checks.find(c => c.key === 'freibord')!
    expect(freibord.datenluecke).toBeUndefined()
    expect(freibord.wertText).toContain('%')
    expect(freibord.ampel).toBe('gruen') // Tank 735: (20.4−15)/20.4 = 26.5 %
    // Jeder Check hat Grenze, Einordnung (Verdikt + Marktreferenz) und Tooltip
    for (const c of checks) {
      expect(c.grenze.length).toBeGreaterThan(0)
      expect(c.einordnung.length).toBeGreaterThan(0)
      expect(c.tooltip.length).toBeGreaterThan(0)
    }
  })

  it('Freibord-Zeile entfällt (nicht «Datenlücke»), wenn das Tankvolumen wirklich fehlt', () => {
    const e = berechne(BASIS)
    const ohneVolumen: Anlage = { ...anlage('4398'), innenvolumenL: undefined }
    const checks = engineeringChecks(ohneVolumen, kontext(e))
    expect(checks.find(c => c.key === 'freibord')).toBeUndefined()
  })

  it('Einordnung liefert Verdikt + Marktreferenz', () => {
    expect(einordnung('dp', 'gruen')).toContain('Marktbegleiter')
    expect(einordnung('velocity', 'gruen')).toContain('60 m/h')
    expect(einordnung('intervall', 'rot')).toContain('risiko')
  })

  it('4-Personen-Basisfall auf Twin 15: velocity/dp/bett/freibord/intervall/beladung grün', () => {
    const e = berechne(BASIS)
    const checks = engineeringChecks(anlage('4398'), kontext(e))
    const byKey = Object.fromEntries(checks.map(c => [c.key, c]))
    expect(byKey.velocity.ampel).toBe('gruen')  // 29.6 m/h
    expect(byKey.dp.ampel).toBe('gruen')        // 0.006×29.6×0.60+0.25 ≈ 0.36 bar
    expect(byKey.bett.ampel).toBe('gruen')      // 0.60 m
    expect(byKey.freibord.ampel).toBe('gruen')  // 26.5 %
    expect(byKey.intervall.ampel).toBe('gruen') // 4.0 Tage (Zwang)
    expect(byKey.beladung.ampel).toBe('gruen')
    expect(byKey.natrium.ampel).toBe('gelb')    // 169 mg/l → 150–200 = gelb
  })

  it('schlechtesteAmpel aggregiert korrekt', () => {
    const e = berechne(BASIS)
    const checks = engineeringChecks(anlage('4398'), kontext(e))
    expect(['gelb', 'rot']).toContain(schlechtesteAmpel(checks)) // Datenlücken → mind. gelb
  })

  it('Grenzfall: Natrium > 200 wird rot gemeldet', () => {
    const e = berechne({ ...BASIS, rohwasserhaerte: 40, resthaerte: 2 })
    const checks = engineeringChecks(anlage('4398'), kontext(e))
    expect(checks.find(c => c.key === 'natrium')!.ampel).toBe('rot')
  })

  it('Grenzfall: Intervall > 7 Tage ohne Zwangsregeneration → rot', () => {
    const e = berechne({ ...BASIS, maxRegenIntervall: 0 })
    const checks = engineeringChecks(anlage('4404'), kontext(e)) // Twin 100 auf Minibedarf
    const intervall = checks.find(c => c.key === 'intervall')!
    expect(intervall.ampel).toBe('rot') // 100×5/12 = 41.7 Tage → Stagnation
  })
})

describe('Datencheck Produkttabelle (Teil C)', () => {
  const report = pruefeKatalog()

  it('prüft alle Katalogeinträge (inkl. neuer 2xWS2-Baureihe)', () => {
    expect(report.length).toBe(ANLAGEN_KATALOG.length)
    expect(ANLAGEN_KATALOG.some(a => a.kategorie === 'parallel_2')).toBe(true)
  })

  it('nach dem 4403-Fix (Tank 1354/Ø13"): ALLE Anlagen konsistent – Datencheck grün', () => {
    for (const r of report) {
      expect(r.status, `${r.name}: ${r.probleme.join('; ')}`).toBe('ok')
    }
  })

  it('Tanktabelle deckt alle verwendeten Tank-Codes ab', () => {
    for (const a of ANLAGEN_KATALOG) {
      expect(TANK_DATEN[a.tank], `Tank ${a.tank} fehlt in TANK_DATEN`).toBeDefined()
    }
  })
})

describe('Auslegungsmodus ändert nur Grenzen/Auswahl, nicht die Physik', () => {
  it('identische physikalische Werte in beiden Modi', () => {
    const robust = berechne({ ...BASIS, modus: 'robust' })
    const kompakt = berechne({ ...BASIS, modus: 'kompakt' })
    expect(kompakt.volumenstromEnthaerter).toBe(robust.volumenstromEnthaerter)
    expect(kompakt.harzmengeProFlasche).toBe(robust.harzmengeProFlasche)
    expect(kompakt.salzverbrauchMonat).toBe(robust.salzverbrauchMonat)
    expect(kompakt.natriumNachEnthaertung).toBe(robust.natriumNachEnthaertung)
  })

  it('Grenzwerte sind zentral definiert und konsistent gestaffelt', () => {
    expect(GRENZWERTE.velocity.robust.gruen).toBeLessThan(GRENZWERTE.velocity.kompakt.gruen)
    expect(GRENZWERTE.velocity.kompakt.gelb).toBeLessThanOrEqual(V_HARTLIMIT_MH)
    expect(GRENZWERTE.dp.robust.gelb).toBeLessThanOrEqual(GRENZWERTE.dp.kompakt.gelb)
  })
})
