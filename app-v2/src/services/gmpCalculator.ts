// GMP Calculator - various calculations for cleanroom and aseptic processing

// Air change rate calculations
export interface AirChangeConfig {
  roomVolume: number // m³
  airFlow: number // m³/h
  gradeClass: 'A' | 'B' | 'C' | 'D'
}

export function calculateAirChangeRate(config: AirChangeConfig): {
  achRate: number
  compliant: boolean
  recommendation: string
} {
  const achRate = config.airFlow / config.roomVolume
  
  const requirements: Record<string, { min: number; recommended: number }> = {
    A: { min: 20, recommended: 30 }, // Unidirectional flow, not ACH based but for reference
    B: { min: 20, recommended: 30 },
    C: { min: 20, recommended: 30 },
    D: { min: 10, recommended: 20 }
  }
  
  const req = requirements[config.gradeClass]
  const compliant = achRate >= req.min
  
  let recommendation = ''
  if (achRate < req.min) {
    recommendation = `NESKŁADNI! Potrebujete vsaj ${req.min} ACH za Grade ${config.gradeClass}. Trenutno: ${achRate.toFixed(1)} ACH`
  } else if (achRate < req.recommended) {
    recommendation = `Skladni, vendar priporočeno je ${req.recommended} ACH za optimalno delovanje.`
  } else {
    recommendation = `SKLADNI - Izpolnjujete priporočene zahteve za Grade ${config.gradeClass}.`
  }
  
  return { achRate, compliant, recommendation }
}

// Recovery time calculation (time to clean from Grade X to Y)
export interface RecoveryConfig {
  currentParticles: number
  targetParticles: number
  achRate: number
}

export function calculateRecoveryTime(config: RecoveryConfig): {
  timeMinutes: number
  explanation: string
} {
  // Using exponential decay: Ct = C0 * e^(-ACH * t)
  // Solve for t: t = -ln(Ct/C0) / ACH
  
  const ratio = config.targetParticles / config.currentParticles
  const timeHours = -Math.log(ratio) / config.achRate
  const timeMinutes = timeHours * 60
  
  const explanation = `Za zmanjšanje števila delcev iz ${config.currentParticles.toLocaleString()} na ${config.targetParticles.toLocaleString()} pri ${config.achRate} ACH potrebujete približno ${timeMinutes.toFixed(1)} minut.`
  
  return { timeMinutes, explanation }
}

// Disinfectant contact time calculator
export interface DisinfectantConfig {
  type: 'alcohol' | 'sporicidal' | 'oxidizing'
  surface: 'floor' | 'wall' | 'equipment' | 'pass-through'
  gradeClass: 'A' | 'B' | 'C' | 'D'
}

export function calculateDisinfectantContactTime(config: DisinfectantConfig): {
  minContactTime: number // minutes
  dryTime: number // minutes
  recommendation: string
} {
  const contactTimes: Record<string, Record<string, number>> = {
    alcohol: {
      floor: 10,
      wall: 5,
      equipment: 5,
      'pass-through': 3
    },
    sporicidal: {
      floor: 30,
      wall: 20,
      equipment: 15,
      'pass-through': 10
    },
    oxidizing: {
      floor: 15,
      wall: 10,
      equipment: 10,
      'pass-through': 5
    }
  }
  
  const dryTimes: Record<string, number> = {
    alcohol: 5,
    sporicidal: 20,
    oxidizing: 15
  }
  
  const minContactTime = contactTimes[config.type]?.[config.surface] || 10
  const dryTime = dryTimes[config.type] || 10
  
  let recommendation = `Za ${config.type} dezinfekcijo ${config.surface} v Grade ${config.gradeClass}:\n`
  recommendation += `- Minimalni kontaktni čas: ${minContactTime} minut\n`
  recommendation += `- Čas sušenja: ${dryTime} minut\n`
  recommendation += `- Skupni čas: ${minContactTime + dryTime} minut\n\n`
  
  if (config.gradeClass === 'A' || config.gradeClass === 'B') {
    recommendation += `⚠️ Za Grade A/B priporočamo:\n`
    recommendation += `- Rotacija dezinfekcijskih sredstev\n`
    recommendation += `- Sporicidna dezinfekcija vsaj 1x tedensko\n`
    recommendation += `- Mikrobiološka verifikacija učinkovitosti`
  }
  
  return { minContactTime, dryTime, recommendation }
}

// Particle count limit checker
export interface ParticleCount {
  gradeClass: 'A' | 'B' | 'C' | 'D'
  atRest: boolean
  size05um?: number
  size50um?: number
}

export function checkParticleLimits(count: ParticleCount): {
  compliant: boolean
  limits: { size05um: number; size50um: number }
  result: string
} {
  const limits: Record<string, Record<string, { size05um: number; size50um: number }>> = {
    A: {
      atRest: { size05um: 3520, size50um: 20 },
      inOperation: { size05um: 3520, size50um: 20 }
    },
    B: {
      atRest: { size05um: 3520, size50um: 29 },
      inOperation: { size05um: 352000, size50um: 2900 }
    },
    C: {
      atRest: { size05um: 352000, size50um: 2900 },
      inOperation: { size05um: 3520000, size50um: 29000 }
    },
    D: {
      atRest: { size05um: 3520000, size50um: 29000 },
      inOperation: { size05um: 3520000, size50um: 29000 }
    }
  }
  
  const state = count.atRest ? 'atRest' : 'inOperation'
  const limit = limits[count.gradeClass][state]
  
  const compliant05 = !count.size05um || count.size05um <= limit.size05um
  const compliant50 = !count.size50um || count.size50um <= limit.size50um
  const compliant = compliant05 && compliant50
  
  let result = `Grade ${count.gradeClass} (${count.atRest ? 'At Rest' : 'In Operation'}):\n\n`
  
  if (count.size05um !== undefined) {
    result += `≥0.5 µm: ${count.size05um.toLocaleString()} / ${limit.size05um.toLocaleString()} `
    result += compliant05 ? '✅\n' : '❌ PRESEŽENA MEJA!\n'
  }
  
  if (count.size50um !== undefined) {
    result += `≥5.0 µm: ${count.size50um.toLocaleString()} / ${limit.size50um.toLocaleString()} `
    result += compliant50 ? '✅\n' : '❌ PRESEŽENA MEJA!\n'
  }
  
  result += `\n${compliant ? '✅ SKLADNI z Annex 1' : '❌ NESKLÁDNI - potrebna preiskava in CAPA'}`
  
  return { compliant, limits: limit, result }
}

// Differential pressure checker
export interface PressureConfig {
  area: string
  measureddP: number // Pa
  gradeClass: 'A' | 'B' | 'C' | 'D'
  adjacentGrade: 'B' | 'C' | 'D' | 'unclassified'
}

export function checkDifferentialPressure(config: PressureConfig): {
  compliant: boolean
  recommendeddP: number
  result: string
} {
  // Annex 1 recommends 10-15 Pa between grades
  const recommendeddP = 12 // Pa
  const minDP = 10 // Pa
  
  const compliant = config.measureddP >= minDP
  
  let result = `${config.area}: Grade ${config.gradeClass} → ${config.adjacentGrade}\n`
  result += `Izmerjeno: ${config.measureddP} Pa\n`
  result += `Zahtevano: ≥ ${minDP} Pa (priporočeno: ${recommendeddP} Pa)\n\n`
  
  if (compliant) {
    result += `✅ SKLADNI`
  } else {
    result += `❌ NESKLÁDNI - diferencialni tlak prenizek!\n`
    result += `⚠️ Tveganje za kontaminacijo zaradi obratnega toka zraka.`
  }
  
  return { compliant, recommendeddP, result }
}

// Viable particle (microbiological) limits
export interface MicroCount {
  gradeClass: 'A' | 'B' | 'C' | 'D'
  method: 'settle-plate' | 'active-air' | 'surface' | 'glove'
  count: number
}

export function checkMicrobiologicalLimits(config: MicroCount): {
  compliant: boolean
  limit: number
  unit: string
  result: string
} {
  const limits: Record<string, Record<string, { limit: number; unit: string }>> = {
    A: {
      'settle-plate': { limit: 1, unit: 'CFU/4 hours' },
      'active-air': { limit: 1, unit: 'CFU/m³' },
      surface: { limit: 1, unit: 'CFU/plate' },
      glove: { limit: 1, unit: 'CFU/glove' }
    },
    B: {
      'settle-plate': { limit: 5, unit: 'CFU/4 hours' },
      'active-air': { limit: 10, unit: 'CFU/m³' },
      surface: { limit: 5, unit: 'CFU/plate' },
      glove: { limit: 5, unit: 'CFU/glove' }
    },
    C: {
      'settle-plate': { limit: 50, unit: 'CFU/4 hours' },
      'active-air': { limit: 100, unit: 'CFU/m³' },
      surface: { limit: 25, unit: 'CFU/plate' },
      glove: { limit: 0, unit: 'N/A' }
    },
    D: {
      'settle-plate': { limit: 100, unit: 'CFU/4 hours' },
      'active-air': { limit: 200, unit: 'CFU/m³' },
      surface: { limit: 50, unit: 'CFU/plate' },
      glove: { limit: 0, unit: 'N/A' }
    }
  }
  
  const limitData = limits[config.gradeClass][config.method]
  const compliant = config.count <= limitData.limit
  
  let result = `Grade ${config.gradeClass} - ${config.method}:\n`
  result += `Izmerjeno: ${config.count} ${limitData.unit}\n`
  result += `Meja: ${limitData.limit} ${limitData.unit}\n\n`
  result += compliant ? '✅ SKLADNI' : '❌ PRESEŽENA MEJA - potrebna preiskava!'
  
  return {
    compliant,
    limit: limitData.limit,
    unit: limitData.unit,
    result
  }
}

// Media fill acceptance calculator
export interface MediaFillResult {
  totalUnits: number
  contaminatedUnits: number
}

export function evaluateMediaFill(result: MediaFillResult): {
  accepted: boolean
  contaminationRate: number
  recommendation: string
} {
  const contaminationRate = (result.contaminatedUnits / result.totalUnits) * 100
  
  // Annex 1: contamination rate should be <0.1% with confidence level
  const threshold = 0.1 // %
  const accepted = contaminationRate < threshold && result.contaminatedUnits === 0
  
  let recommendation = `Media Fill Rezultat:\n`
  recommendation += `- Skupno enot: ${result.totalUnits}\n`
  recommendation += `- Kontaminirane enote: ${result.contaminatedUnits}\n`
  recommendation += `- Stopnja kontaminacije: ${contaminationRate.toFixed(3)}%\n\n`
  
  if (contaminationRate === 0) {
    recommendation += `✅ SPREJETO - brez kontaminacije\n`
    recommendation += `Potrebujete vsaj 3 zaporedne uspešne media fills za validacijo.`
  } else if (contaminationRate < threshold) {
    recommendation += `⚠️ MEJNI REZULTAT\n`
    recommendation += `Potrebna je poglobljena preiskava kontaminacije.\n`
    recommendation += `Ovrednotite vzrok in ponovite media fill.`
  } else {
    recommendation += `❌ NESPREJEMLJIVO\n`
    recommendation += `Stopnja kontaminacije presega ${threshold}%.\n`
    recommendation += `Potrebna je:\n`
    recommendation += `- Podrobna preiskava vzroka\n`
    recommendation += `- CAPA implementacija\n`
    recommendation += `- Ponovna validacija po popravnih ukrepih`
  }
  
  return { accepted, contaminationRate, recommendation }
}

// 8. Sterile filtration flow rate calculator
export interface FilterFlowConfig {
  filterArea: number // cm²
  flowRate: number // L/min
  filterType: '0.22um' | '0.45um'
}

export function calculateFilterFlowRate(config: FilterFlowConfig): {
  flowPerArea: number
  compliant: boolean
  recommendation: string
} {
  const flowPerArea = config.flowRate / (config.filterArea / 100) // L/min per cm² to dm²
  
  // Typical max flow rates
  const maxFlowRates = {
    '0.22um': 2.0, // L/min/dm²
    '0.45um': 4.0
  }
  
  const maxFlow = maxFlowRates[config.filterType]
  const compliant = flowPerArea <= maxFlow
  
  let recommendation = `Pretok na površino filtra: ${flowPerArea.toFixed(2)} L/min/dm²\n`
  recommendation += `Maks. priporočeno za ${config.filterType}: ${maxFlow} L/min/dm²\n\n`
  
  if (compliant) {
    recommendation += `✅ SKLADNI - pretok je v priporočenih mejah`
  } else {
    recommendation += `❌ PRESEŽEN PRETOK - tveganje za integriteto filtra!\n`
    recommendation += `Zmanjšajte pretok ali povečajte površino filtra.`
  }
  
  return { flowPerArea, compliant, recommendation }
}

// 9. Clean room personnel calculation
export interface PersonnelConfig {
  roomArea: number // m²
  gradeClass: 'A' | 'B' | 'C' | 'D'
  simultaneousOperators: number
}

export function calculatePersonnelDensity(config: PersonnelConfig): {
  areaPerPerson: number
  compliant: boolean
  recommendation: string
} {
  const areaPerPerson = config.roomArea / config.simultaneousOperators
  
  // Minimum area per person recommendations
  const minAreaPerPerson: Record<string, number> = {
    A: 10, // m² - very limited personnel
    B: 8,
    C: 6,
    D: 4
  }
  
  const minArea = minAreaPerPerson[config.gradeClass]
  const compliant = areaPerPerson >= minArea
  
  let recommendation = `Površina na osebo: ${areaPerPerson.toFixed(1)} m²\n`
  recommendation += `Minimalno priporočeno za Grade ${config.gradeClass}: ${minArea} m²\n\n`
  
  if (compliant) {
    recommendation += `✅ SKLADNI - ustrezna površina za število osebja`
  } else {
    recommendation += `❌ PRENATRPANOST!\n`
    recommendation += `Zmanjšajte število osebja ali povečajte površino prostora.\n`
    recommendation += `Povečano tveganje za kontaminacijo zaradi prevelike gostote osebja.`
  }
  
  return { areaPerPerson, compliant, recommendation }
}

// 10. Gowning qualification time calculator
export interface GowningConfig {
  gradeClass: 'A' | 'B' | 'C' | 'D'
  experience: 'novice' | 'trained' | 'expert'
}

export function calculateGowningTime(config: GowningConfig): {
  expectedTime: number
  maxTime: number
  recommendation: string
} {
  // Expected gowning times in minutes
  const baseTimes: Record<string, number> = {
    A: 15, // Grade A/B aseptic gowning
    B: 15,
    C: 8,
    D: 5
  }
  
  const experienceMultiplier = {
    novice: 1.5,
    trained: 1.0,
    expert: 0.8
  }
  
  const expectedTime = baseTimes[config.gradeClass] * experienceMultiplier[config.experience]
  const maxTime = expectedTime * 1.3 // 30% tolerance
  
  let recommendation = `Pričakovani čas za Grade ${config.gradeClass} (${config.experience}):\n`
  recommendation += `- Povprečen čas: ${expectedTime.toFixed(1)} minut\n`
  recommendation += `- Maksimalni dopustni čas: ${maxTime.toFixed(1)} minut\n\n`
  recommendation += `💡 Priporočila:\n`
  recommendation += `- Redni treningi za osebje\n`
  recommendation += `- Nadzor časa oblačenja\n`
  recommendation += `- Kvalifikacija pred vstopom v Grade A/B območja`
  
  return { expectedTime, maxTime, recommendation }
}

// 11. Compressed gas purity calculator
export interface GasPurityConfig {
  gasType: 'nitrogen' | 'compressed-air' | 'co2'
  oilContent: number // mg/m³
  waterDewPoint: number // °C
  particleCount: number // particles/m³
}

export function checkGasPurity(config: GasPurityConfig): {
  compliant: boolean
  issues: string[]
  recommendation: string
} {
  const issues: string[] = []
  
  // ISO 8573-1 Class 1-2 requirements for pharmaceutical compressed gases
  const limits = {
    oilContent: 0.01, // mg/m³
    waterDewPoint: -40, // °C
    particleCount: 400 // particles/m³ (>0.1μm)
  }
  
  if (config.oilContent > limits.oilContent) {
    issues.push(`Vsebnost olja: ${config.oilContent} mg/m³ (meja: ${limits.oilContent})`)
  }
  
  if (config.waterDewPoint > limits.waterDewPoint) {
    issues.push(`Rosišče: ${config.waterDewPoint}°C (meja: ${limits.waterDewPoint}°C)`)
  }
  
  if (config.particleCount > limits.particleCount) {
    issues.push(`Delci: ${config.particleCount}/m³ (meja: ${limits.particleCount})`)
  }
  
  const compliant = issues.length === 0
  
  let recommendation = `Čistost plina (${config.gasType}):\n\n`
  
  if (compliant) {
    recommendation += `✅ SKLADNI - vsi parametri izpolnjujejo zahteve ISO 8573-1`
  } else {
    recommendation += `❌ NESKLADNI:\n${issues.join('\n')}\n\n`
    recommendation += `Potrebni ukrepi:\n`
    recommendation += `- Preveri filtre in sušilnike\n`
    recommendation += `- Vzdrževanje kompresorja\n`
    recommendation += `- Testiranje čistosti pred uporabo`
  }
  
  return { compliant, issues, recommendation }
}

// 12. Water system TOC calculator
export interface WaterTOCConfig {
  tocReading: number // ppb
  waterType: 'purified' | 'wfi'
}

export function checkWaterTOC(config: WaterTOCConfig): {
  compliant: boolean
  recommendation: string
} {
  const limits = {
    purified: 500, // ppb (USP/EP)
    wfi: 500 // ppb
  }
  
  const limit = limits[config.waterType]
  const compliant = config.tocReading <= limit
  
  let recommendation = `TOC ${config.waterType === 'wfi' ? 'WFI' : 'Purified Water'}:\n`
  recommendation += `Izmerjeno: ${config.tocReading} ppb\n`
  recommendation += `Meja: ${limit} ppb\n\n`
  
  if (compliant) {
    recommendation += `✅ SKLADNI`
  } else {
    recommendation += `❌ PRESEŽENA MEJA!\n`
    recommendation += `Možni vzroki:\n`
    recommendation += `- Bakterijska rast v sistemu\n`
    recommendation += `- Kontaminacija organske snovi\n`
    recommendation += `- Okvara RO/EDI sistema\n`
    recommendation += `Ukrepi: sanitizacija, preiskava, ponovno testiranje`
  }
  
  return { compliant, recommendation }
}

// 13. Autoclave cycle validation calculator
export interface AutoclaveConfig {
  temperature: number // °C
  exposureTime: number // minutes
  pressure: number // bar
  processType: 'porous' | 'liquid' | 'wrapped'
}

export function validateAutoclaveCycle(config: AutoclaveConfig): {
  fValue: number
  compliant: boolean
  recommendation: string
} {
  // F0 calculation: F0 = Σ 10^((T-121.1)/Z) * Δt
  // Simplified: assuming constant temp, Z=10
  const z = 10
  const refTemp = 121.1
  const fValue = Math.pow(10, (config.temperature - refTemp) / z) * config.exposureTime
  
  // Minimum F0 values
  const minF0: Record<string, number> = {
    porous: 8,
    liquid: 15,
    wrapped: 12
  }
  
  const requiredF0 = minF0[config.processType]
  const compliant = fValue >= requiredF0 && config.temperature >= 121
  
  let recommendation = `F0 vrednost: ${fValue.toFixed(1)}\n`
  recommendation += `Zahtevana F0 za ${config.processType}: ${requiredF0}\n`
  recommendation += `Temperatura: ${config.temperature}°C (min. 121°C)\n`
  recommendation += `Čas ekspozicije: ${config.exposureTime} min\n\n`
  
  if (compliant) {
    recommendation += `✅ USTREZEN STERILIZACIJSKI CIKEL`
  } else {
    recommendation += `❌ NEUSTREZNO!\n`
    if (fValue < requiredF0) {
      recommendation += `F0 vrednost prenizka - podaljšajte čas ali povečajte temperaturo`
    }
    if (config.temperature < 121) {
      recommendation += `Temperatura prenizka - zahtevana min. 121°C`
    }
  }
  
  return { fValue, compliant, recommendation }
}

// 14. Isolator H2O2 concentration calculator
export interface H2O2Config {
  concentration: number // ppm
  exposureTime: number // minutes
  humidity: number // %RH
}

export function validateH2O2Decontamination(config: H2O2Config): {
  compliant: boolean
  recommendation: string
} {
  // Typical requirements: 500-1500 ppm for 10-30 min at <50% RH
  const minConcentration = 500
  const maxConcentration = 1500
  const minTime = 10
  const maxHumidity = 50
  
  const concCompliant = config.concentration >= minConcentration && config.concentration <= maxConcentration
  const timeCompliant = config.exposureTime >= minTime
  const humidityCompliant = config.humidity <= maxHumidity
  
  const compliant = concCompliant && timeCompliant && humidityCompliant
  
  let recommendation = `H₂O₂ dekontaminacija:\n`
  recommendation += `- Koncentracija: ${config.concentration} ppm (${minConcentration}-${maxConcentration} ppm)\n`
  recommendation += `- Čas ekspozicije: ${config.exposureTime} min (min. ${minTime} min)\n`
  recommendation += `- Vlažnost: ${config.humidity}% RH (maks. ${maxHumidity}%)\n\n`
  
  if (compliant) {
    recommendation += `✅ USTREZEN CIKEL DEKONTAMINACIJE`
  } else {
    recommendation += `❌ NEUSKŁADNI:\n`
    if (!concCompliant) recommendation += `- Prilagodite koncentracijo H₂O₂\n`
    if (!timeCompliant) recommendation += `- Podaljšajte čas ekspozicije\n`
    if (!humidityCompliant) recommendation += `- Znižajte vlažnost pred ciklom\n`
  }
  
  return { compliant, recommendation }
}

// 15. Bioburden testing sample size calculator
export interface BioburdenConfig {
  batchSize: number // units
  riskLevel: 'low' | 'medium' | 'high'
}

export function calculateBioburdenSampleSize(config: BioburdenConfig): {
  sampleSize: number
  recommendation: string
} {
  // Square root method with risk adjustment
  let sampleSize = Math.ceil(Math.sqrt(config.batchSize))
  
  const riskMultiplier = {
    low: 1.0,
    medium: 1.5,
    high: 2.0
  }
  
  sampleSize = Math.ceil(sampleSize * riskMultiplier[config.riskLevel])
  
  // Minimum 10, maximum 100 samples
  sampleSize = Math.max(10, Math.min(100, sampleSize))
  
  let recommendation = `Velikost vzorca za bioburden:\n`
  recommendation += `- Velikost serije: ${config.batchSize} enot\n`
  recommendation += `- Raven tveganja: ${config.riskLevel}\n`
  recommendation += `- Priporočen vzorec: ${sampleSize} enot\n\n`
  recommendation += `💡 Testiranje izvajajte:\n`
  recommendation += `- Aseptično odvzemanje vzorcev\n`
  recommendation += `- Inkubacija 3-7 dni pri 30-35°C\n`
  recommendation += `- Dokumentirajte vse rezultate`
  
  return { sampleSize, recommendation }
}

// 16. HEPA filter integrity test calculator
export interface HEPATestConfig {
  upstreamConcentration: number // particles/L
  downstreamConcentration: number // particles/L
  filterClass: 'H13' | 'H14' | 'U15'
}

export function validateHEPAIntegrity(config: HEPATestConfig): {
  efficiency: number
  compliant: boolean
  recommendation: string
} {
  const efficiency = ((config.upstreamConcentration - config.downstreamConcentration) / config.upstreamConcentration) * 100
  
  const minEfficiency: Record<string, number> = {
    H13: 99.95,
    H14: 99.995,
    U15: 99.9995
  }
  
  const required = minEfficiency[config.filterClass]
  const compliant = efficiency >= required
  
  let recommendation = `HEPA Filter ${config.filterClass} Integrity Test:\n`
  recommendation += `- Upstream: ${config.upstreamConcentration} delcev/L\n`
  recommendation += `- Downstream: ${config.downstreamConcentration} delcev/L\n`
  recommendation += `- Učinkovitost: ${efficiency.toFixed(4)}%\n`
  recommendation += `- Zahtevana: ${required}%\n\n`
  
  if (compliant) {
    recommendation += `✅ FILTER USTREZA - integrity test passed`
  } else {
    recommendation += `❌ FILTER NE USTREZA!\n`
    recommendation += `Možni vzroki:\n`
    recommendation += `- Puščanje v tesnilih\n`
    recommendation += `- Poškodovan filter medij\n`
    recommendation += `- Nepravilna namestitev\n`
    recommendation += `Ukrepi: zamenjava filtra ali popravek montaže`
  }
  
  return { efficiency, compliant, recommendation }
}

// 17. Lyophilization cycle optimization
export interface LyophilizationConfig {
  productTemp: number // °C
  shelfTemp: number // °C
  chamberPressure: number // mTorr
  freezingPoint: number // °C
}

export function optimizeLyophilizationCycle(config: LyophilizationConfig): {
  sublimationRate: string
  recommendation: string
} {
  const tempDiff = config.shelfTemp - config.productTemp
  const isOptimal = tempDiff >= 5 && tempDiff <= 15 && config.productTemp < config.freezingPoint - 5
  
  let sublimationRate = 'neznana'
  if (tempDiff < 5) sublimationRate = 'prenizka'
  else if (tempDiff > 15) sublimationRate = 'tveganje za previsoko'
  else sublimationRate = 'optimalna'
  
  let recommendation = `Lyophilization parametre:\n`
  recommendation += `- Temp. produkta: ${config.productTemp}°C\n`
  recommendation += `- Temp. police: ${config.shelfTemp}°C\n`
  recommendation += `- Tlak komore: ${config.chamberPressure} mTorr\n`
  recommendation += `- Točka zmrzovanja: ${config.freezingPoint}°C\n`
  recommendation += `- ΔT (polica-produkt): ${tempDiff.toFixed(1)}°C\n\n`
  
  if (isOptimal) {
    recommendation += `✅ OPTIMALNI POGOJI ZA SUBLIMACIJO`
  } else {
    recommendation += `⚠️ PRILAGODITEV POTREBNA:\n`
    if (config.productTemp >= config.freezingPoint - 5) {
      recommendation += `- Produkt prezgodaj nad točko zmrzovanja!\n`
    }
    if (tempDiff < 5) {
      recommendation += `- Povečajte temp. police za hitrejšo sublimacijo\n`
    }
    if (tempDiff > 15) {
      recommendation += `- Zmanjšajte temp. police - tveganje za kolaps strukture\n`
    }
  }
  
  return { sublimationRate, recommendation }
}

// 18. Vial washing efficiency calculator
export interface VialWashConfig {
  injectionVolume: number // mL
  injectionPressure: number // bar
  temperature: number // °C
  washSteps: number
}

export function evaluateVialWashing(config: VialWashConfig): {
  score: number
  recommendation: string
} {
  let score = 0
  
  // Scoring based on best practices
  if (config.injectionVolume >= 5 && config.injectionVolume <= 10) score += 25
  if (config.injectionPressure >= 2 && config.injectionPressure <= 4) score += 25
  if (config.temperature >= 70 && config.temperature <= 85) score += 25
  if (config.washSteps >= 3) score += 25
  
  let recommendation = `Washing učinkovitost:\n`
  recommendation += `- Volumen injiciranja: ${config.injectionVolume} mL (opt: 5-10 mL)\n`
  recommendation += `- Tlak: ${config.injectionPressure} bar (opt: 2-4 bar)\n`
  recommendation += `- Temperatura: ${config.temperature}°C (opt: 70-85°C)\n`
  recommendation += `- Število korakov: ${config.washSteps} (min: 3)\n`
  recommendation += `- Ocena: ${score}/100\n\n`
  
  if (score >= 90) {
    recommendation += `✅ ODLIČNA KONFIGURACIJA`
  } else if (score >= 70) {
    recommendation += `⚠️ ZADOVOLJIVO - možne izboljšave`
  } else {
    recommendation += `❌ NEZADOSTNO - potrebna optimizacija parametrov`
  }
  
  return { score, recommendation }
}

// 19. Temperature mapping sensor placement calculator
export interface TempMappingConfig {
  roomVolume: number // m³
  gradeClass: 'A' | 'B' | 'C' | 'D'
}

export function calculateTempMappingSensors(config: TempMappingConfig): {
  minSensors: number
  recommendedSensors: number
  recommendation: string
} {
  // Rule of thumb: 1 sensor per 2m³ for Grade A/B, 1 per 4m³ for C/D
  const densityFactor = (config.gradeClass === 'A' || config.gradeClass === 'B') ? 2 : 4
  
  const minSensors = Math.max(9, Math.ceil(config.roomVolume / densityFactor))
  const recommendedSensors = minSensors + 3 // Add sensors for critical zones
  
  let recommendation = `Temperature Mapping:\n`
  recommendation += `- Prostornina: ${config.roomVolume} m³\n`
  recommendation += `- Grade: ${config.gradeClass}\n`
  recommendation += `- Minimalno senzorjev: ${minSensors}\n`
  recommendation += `- Priporočeno senzorjev: ${recommendedSensors}\n\n`
  recommendation += `💡 Namestitev:\n`
  recommendation += `- En senzor v vsakem vogalu\n`
  recommendation += `- En v centru prostora\n`
  recommendation += `- Pri kritičnih lokacijah (vrata, oprema)\n`
  recommendation += `- Logging interval: 1-5 minut\n`
  recommendation += `- Trajanje: minimum 24 ur`
  
  return { minSensors, recommendedSensors, recommendation }
}

// 20. Endotoxin testing sample dilution calculator
export interface EndotoxinConfig {
  sampleConcentration: number // mg/mL
  mvd: number // Maximum Valid Dilution
  expectedEndotoxin: number // EU/mL
}

export function calculateEndotoxinDilution(config: EndotoxinConfig): {
  recommendedDilution: number
  testConcentration: number
  recommendation: string
} {
  // Calculate dilution that keeps within detection range (0.01 - 1 EU/mL typical)
  const targetEndotoxin = 0.25 // EU/mL - middle of range
  const recommendedDilution = Math.max(1, Math.ceil(config.expectedEndotoxin / targetEndotoxin))
  
  // Check MVD compliance
  const testConcentration = config.sampleConcentration / recommendedDilution
  const mvdCompliant = recommendedDilution <= config.mvd
  
  let recommendation = `Endotoxin Test Dilution:\n`
  recommendation += `- Koncentracija vzorca: ${config.sampleConcentration} mg/mL\n`
  recommendation += `- MVD: ${config.mvd}\n`
  recommendation += `- Pričakovani endotoksin: ${config.expectedEndotoxin} EU/mL\n`
  recommendation += `- Priporočena dilucija: 1:${recommendedDilution}\n`
  recommendation += `- Test koncentracija: ${testConcentration.toFixed(3)} mg/mL\n\n`
  
  if (mvdCompliant) {
    recommendation += `✅ DILUCIJA V MEJAH MVD\n`
    recommendation += `Izvedite test v duplikatu ali triplikatu.`
  } else {
    recommendation += `❌ DILUCIJA PRESEGA MVD!\n`
    recommendation += `Potrebna re-validacija metode ali uporaba drugega pristopa.`
  }
  
  return { recommendedDilution, testConcentration, recommendation }
}

// 21. Grade A unidirectional airflow velocity check
export interface AirVelocityConfig {
  measuredVelocity: number // m/s
}

export function checkAirVelocity(config: AirVelocityConfig): {
  compliant: boolean
  recommendation: string
} {
  const min = 0.36
  const max = 0.54
  const v = config.measuredVelocity
  const compliant = v >= min && v <= max
  let recommendation = `Izmerjena hitrost zračnega toka nad kritičnim območjem: ${v.toFixed(2)} m/s (cilj: ${min}-${max} m/s)\n\n`
  recommendation += compliant ? '✅ Znotraj priporočil Annex 1' : (v < min ? '❌ PRENIZKA hitrost - tveganje za nestabilen tok' : '❌ PREVISOKA hitrost - tveganje za turbulenco')
  return { compliant, recommendation }
}

// 22. Cleanroom class suggestion based on measured particles
export interface ClassSuggestConfig {
  size05um: number
  size50um: number
  atRest: boolean
}

export function suggestCleanroomClass(cfg: ClassSuggestConfig): {
  suggested: 'A'|'B'|'C'|'D'|'N/A'
  explanation: string
} {
  const grades: Array<'A'|'B'|'C'|'D'> = ['A','B','C','D']
  const results = grades.map(g => checkParticleLimits({ gradeClass: g, atRest: cfg.atRest, size05um: cfg.size05um, size50um: cfg.size50um }))
  const ok = grades.filter((g, i) => results[i].compliant)
  const suggested = ok.length ? ok[0] : 'N/A'
  let explanation = `Meritve: 0.5µm=${cfg.size05um.toLocaleString()}, 5.0µm=${cfg.size50um.toLocaleString()} (${cfg.atRest ? 'At Rest' : 'In Operation'})\n`
  if (suggested !== 'N/A') explanation += `Predlagani razred: Grade ${suggested}`
  else explanation += 'Meritve presegajo meje tudi za Grade D.'
  return { suggested, explanation }
}

// 23. Settle plate maksimalni čas izpostavitve
export interface SettlePlateConfig {
  gradeClass: 'A'|'B'|'C'|'D'
  expectedCFUPerHour: number
}

export function calculateSettlePlateExposure(cfg: SettlePlateConfig): {
  maxHours: number
  recommendation: string
} {
  const limitsPer4h: Record<string, number> = { A: 1, B: 5, C: 50, D: 100 }
  const perHourLimit = limitsPer4h[cfg.gradeClass] / 4
  const maxHours = Math.max(0.5, Math.floor((perHourLimit / Math.max(0.0001, cfg.expectedCFUPerHour)) * 10) / 10)
  let recommendation = `Grade ${cfg.gradeClass}: pričakovan CFU/h=${cfg.expectedCFUPerHour}.\n`
  recommendation += `Maks. izpostavitev plošč: ~${maxHours} h (meje: ${limitsPer4h[cfg.gradeClass]} CFU/4h).`
  return { maxHours, recommendation }
}

// 24. APS (Aseptic Process Simulation) sprejemljivost (poenostavljeno)
export interface ApsConfig { totalUnits: number; contaminationEvents: number }
export function evaluateAPS(cfg: ApsConfig): { accepted: boolean; recommendation: string } {
  const rate = (cfg.contaminationEvents / cfg.totalUnits) * 100
  const accepted = cfg.contaminationEvents === 0 && rate < 0.1
  let recommendation = `APS rezultat: ${cfg.contaminationEvents}/${cfg.totalUnits} (${rate.toFixed(3)}%).\n`
  recommendation += accepted ? '✅ Sprejeto (0 kontaminacij, <0.1%)' : '❌ Nesprejeto - preiskava in ponovitev.'
  return { accepted, recommendation }
}

// 25. Diferencialni tlak – kaskada
export interface CascadeConfig { rooms: number; stepPa: number; startPa: number }
export function designPressureCascade(cfg: CascadeConfig): { setpoints: number[]; recommendation: string } {
  const setpoints = Array.from({ length: cfg.rooms }, (_, i) => cfg.startPa - i * cfg.stepPa)
  let recommendation = `Predlagana kaskada (${cfg.rooms} prostorov, korak ${cfg.stepPa} Pa):\n` + setpoints.map((p, i) => `  Soba ${i + 1}: ${p} Pa`).join('\n')
  return { setpoints, recommendation }
}

// 26. Recovery time with leakage factor
export interface RecoveryLeakConfig { current: number; target: number; ach: number; leakagePct: number }
export function calculateRecoveryWithLeak(cfg: RecoveryLeakConfig): { timeMinutes: number; recommendation: string } {
  const effACH = cfg.ach * (1 - Math.min(Math.max(cfg.leakagePct, 0), 90) / 100)
  const { timeMinutes } = calculateRecoveryTime({ currentParticles: cfg.current, targetParticles: cfg.target, achRate: effACH })
  const recommendation = `Efektivni ACH zaradi puščanj: ${effACH.toFixed(1)}. Ocenjen čas obnove: ${timeMinutes.toFixed(1)} min.`
  return { timeMinutes, recommendation }
}

// 27. Sanitation rotation schedule generator
export interface RotationConfig { weeks: number; agentsCsv: string }
export function generateSanitationRotation(cfg: RotationConfig): { schedule: string[]; recommendation: string } {
  const agents = cfg.agentsCsv.split(',').map(s => s.trim()).filter(Boolean)
  const schedule: string[] = []
  for (let w = 0; w < cfg.weeks; w++) {
    const agent = agents[w % agents.length]
    schedule.push(`Teden ${w + 1}: ${agent}`)
  }
  const recommendation = `Rotacija za ${cfg.weeks} tednov z agensi: ${agents.join(', ')}`
  return { schedule, recommendation }
}

// 28. Ocena izpusta delcev zaradi prisotnosti osebja
export interface OccupancyConfig { operators: number; emissionPerMin: number; minutes: number }
export function estimateOccupancyParticles(cfg: OccupancyConfig): { totalEmitted: number; recommendation: string } {
  const totalEmitted = cfg.operators * cfg.emissionPerMin * cfg.minutes
  const recommendation = `Skupaj emitiranih delcev: ${totalEmitted.toLocaleString()} (operaterji=${cfg.operators}, ${cfg.emissionPerMin}/min, ${cfg.minutes} min).`
  return { totalEmitted, recommendation }
}

// 29. Predikcija zamenjave filtra iz diferencialnega tlaka
export interface FilterLifeConfig { dpInitial: number; dpCurrent: number; dpChangeout: number; hoursUsed: number }
export function predictFilterLife(cfg: FilterLifeConfig): { usedPct: number; remainingHours: number; recommendation: string } {
  const span = cfg.dpChangeout - cfg.dpInitial
  const used = Math.max(0, Math.min(1, (cfg.dpCurrent - cfg.dpInitial) / span))
  const usedPct = used * 100
  const remainingHours = Math.max(0, Math.round((1 - used) * (cfg.hoursUsed / used))) || 0
  let recommendation = `Ocenjena poraba filtra: ${usedPct.toFixed(1)}%. Preostale ure: ~${remainingHours}.`
  if (usedPct >= 100) recommendation += `\n❗ Dosežen kriterij zamenjave. Zamenjajte filter.`
  return { usedPct, remainingHours, recommendation }
}

// 30. HVAC supply/return balance
export interface BalanceConfig { supply: number; exhaust: number }
export function evaluateHVACBalance(cfg: BalanceConfig): { balance: number; recommendation: string } {
  const balance = cfg.supply - cfg.exhaust
  let recommendation = `Ravnotežje pretoka: Supply ${cfg.supply} – Exhaust ${cfg.exhaust} = ${balance} (pozitivno → nadtlak).`
  return { balance, recommendation }
}

// 31. Unidirectional airflow coverage check
export interface CoverageConfig { workingWidth: number; coverageWidth: number }
export function checkUAFCoverage(cfg: CoverageConfig): { compliant: boolean; recommendation: string } {
  const compliant = cfg.coverageWidth >= cfg.workingWidth
  let recommendation = `Širina pokritosti toka: ${cfg.coverageWidth} m / delovno območje ${cfg.workingWidth} m → ${compliant ? '✅' : '❌ premalo pokritja'}`
  return { compliant, recommendation }
}

// 32. VHP cycle validation (alias to H2O2 with adjusted bounds)
export interface VhpConfig { concentration: number; time: number; rh: number }
export function validateVHP(cfg: VhpConfig): { compliant: boolean; recommendation: string } {
  // Typical VHP: 200-1200 ppm, 10-45 min, RH <50%
  const conc = { min: 200, max: 1200 }
  const time = { min: 10, max: 45 }
  const okConc = cfg.concentration >= conc.min && cfg.concentration <= conc.max
  const okTime = cfg.time >= time.min && cfg.time <= time.max
  const okRH = cfg.rh <= 50
  const compliant = okConc && okTime && okRH
  let recommendation = `VHP: ${cfg.concentration} ppm, ${cfg.time} min, RH ${cfg.rh}% → ` + (compliant ? '✅ ustrezno' : '❌ prilagodite parametre')
  return { compliant, recommendation }
}

// 33. EM sampling plan (zrak) – število točk
export interface EmPlanConfig { areaM2: number; grade: 'A'|'B'|'C'|'D' }
export function planEMAirSamples(cfg: EmPlanConfig): { points: number; recommendation: string } {
  // Heuristic: points = ceil(sqrt(area)) with minimums per grade
  const base = Math.ceil(Math.sqrt(Math.max(1, cfg.areaM2)))
  const minByGrade: Record<string, number> = { A: 1, B: 3, C: 5, D: 5 }
  const points = Math.max(minByGrade[cfg.grade], base)
  const recommendation = `Priporočeno število točk za vzorčenje zraka: ${points} (površina ${cfg.areaM2} m², Grade ${cfg.grade}).`
  return { points, recommendation }
}

// 34. Intervention risk scoring
export interface InterventionRiskConfig { frequencyPerShift: number; durationMin: number; proximityCm: number }
export function scoreInterventionRisk(cfg: InterventionRiskConfig): { score: number; level: 'low'|'medium'|'high'; recommendation: string } {
  const score = Math.min(100, Math.round(cfg.frequencyPerShift * 10 + cfg.durationMin * 1 + (100 - Math.min(cfg.proximityCm, 100))))
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const recommendation = `Ocena tveganja intervencije: ${score}/100 (${level}). Zmanjšajte pogostost, trajanje ali povečajte razdaljo.`
  return { score, level, recommendation }
}

// 35. SAL estimator from F0 and bioburden (poenostavljeno)
export interface SalConfig { f0: number; dValue: number; bioburden: number }
export function estimateSAL(cfg: SalConfig): { sal: number; compliant: boolean; recommendation: string } {
  // log reduction = F0 / D; survivors = N0 * 10^(-logRed)
  const logRed = cfg.f0 / Math.max(0.1, cfg.dValue)
  const survivors = cfg.bioburden * Math.pow(10, -logRed)
  const sal = survivors
  const compliant = sal <= 1e-6
  const recommendation = `Ocenjen SAL: ${sal.toExponential(2)} (F0=${cfg.f0}, D=${cfg.dValue}, N0=${cfg.bioburden}). Cilj ≤ 1e-6: ${compliant ? '✅' : '❌'}`
  return { sal, compliant, recommendation }
}

// 36. Aseptic hold time (poenostavljeno)
export interface AsepticHoldConfig { temperatureC: number; covered: boolean }
export function estimateAsepticHold(cfg: AsepticHoldConfig): { hours: number; recommendation: string } {
  let hours = cfg.covered ? 24 : 12
  if (cfg.temperatureC > 25) hours -= 4
  if (cfg.temperatureC < 15) hours += 4
  hours = Math.max(4, Math.min(48, hours))
  const recommendation = `Ocenjen aseptični hold-time: ~${hours} h (T=${cfg.temperatureC}°C, ${cfg.covered ? 'pokrito' : 'nepokrito'}).`
  return { hours, recommendation }
}

// 37. Clean hold time za opremo po čiščenju
export interface CleanHoldConfig { temperatureC: number; humidity: number }
export function estimateCleanHold(cfg: CleanHoldConfig): { hours: number; recommendation: string } {
  let hours = 72
  if (cfg.humidity > 60) hours -= 24
  if (cfg.temperatureC > 25) hours -= 12
  hours = Math.max(12, hours)
  const recommendation = `Ocenjen clean hold-time: ~${hours} h (T=${cfg.temperatureC}°C, RH=${cfg.humidity}%).`
  return { hours, recommendation }
}

// 38. Disinfectant rotation coverage score
export interface RotationScoreConfig { agentsCsv: string }
export function scoreDisinfectantRotation(cfg: RotationScoreConfig): { score: number; recommendation: string } {
  const agents = cfg.agentsCsv.toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  const classes = new Set<string>()
  for (const a of agents) {
    if (a.includes('alcohol')) classes.add('alcohol')
    if (a.includes('sporic')) classes.add('sporicidal')
    if (a.includes('oxid')) classes.add('oxidizing')
    if (a.includes('quat')) classes.add('quat')
  }
  const score = Math.min(100, classes.size * 25 + Math.min(75, agents.length * 5))
  const recommendation = `Pokritost rotacije: ${Array.from(classes).join(', ') || '-'} → ocena ${score}/100.`
  return { score, recommendation }
}

// 39. Comfort environment check
export interface ComfortConfig { temperatureC: number; humidity: number }
export function checkComfortEnv(cfg: ComfortConfig): { ok: boolean; recommendation: string } {
  const ok = cfg.temperatureC >= 18 && cfg.temperatureC <= 22 && cfg.humidity >= 40 && cfg.humidity <= 60
  const recommendation = `Okolje za osebje: ${cfg.temperatureC}°C, ${cfg.humidity}% RH → ${ok ? '✅ udobno' : '⚠️ izven tipičnega območja (18-22°C, 40-60% RH)'}`
  return { ok, recommendation }
}

// 40. Število lokacij za odvzem delcev (ISO 14644 koncept)
export interface SamplerLocConfig { areaM2: number }
export function calculateSamplerLocations(cfg: SamplerLocConfig): { locations: number; recommendation: string } {
  // ISO 14644-1 suggests n = sqrt(A), rounded up. Use minimum 1.
  const locations = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, cfg.areaM2))))
  const recommendation = `Priporočeno število lokacij: ${locations} (površina ${cfg.areaM2} m²).`
  return { locations, recommendation }
}
