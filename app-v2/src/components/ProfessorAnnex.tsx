import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cms, { Lesson } from '../services/cms'
import { useLanguage } from '../contexts/LanguageContext'
import { getNews, getNewsByCategory, seedNewsIfEmpty, markCategoryRead, refreshFromRemote, type NewsItem, isNewsStale, clearNewsCache } from '../services/news'
import { buildRows, rankRows, summarize, collectCitations, type Row } from '../services/search'
import { semanticSearch } from '../services/semanticSearch'
import { matchFAQ } from '../services/faq'
import { getAllTemplates, exportTemplate, type TemplateConfig, type ExportFormat } from '../services/templateGenerator'
import * as GmpCalc from '../services/gmpCalculator'
import ProfessorAvatar from './Avatar/ProfessorAvatar'
import { askGlobalKnowledge, askVectorKnowledge } from '../services/knowledge'
import { chatCompletion, isChatAvailable, setChatApiKey, type ChatMessage } from '../services/chat'
import { useAuth } from '../context/AuthContext'


// Tools Panel Component
function ToolsPanel({ toolTab, setToolTab, fullScreen }: { toolTab: 'templates'|'calculator', setToolTab: (t: 'templates'|'calculator') => void, fullScreen?: boolean }) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('')
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>('docx')
  const [calcType, setCalcType] = React.useState<string>('airchange')
  const [calcInputs, setCalcInputs] = React.useState<any>({})
  const [calcResult, setCalcResult] = React.useState<string>('')
  
  const templates = getAllTemplates()
  
  const handleGenerateTemplate = async () => {
    if (!selectedTemplate) return
    await exportTemplate(selectedTemplate, {
      company: 'Vaša družba',
      site: 'Lokacija',
      preparedBy: '[Ime]',
      reviewedBy: '[Ime]',
      approvedBy: '[Ime]'
    }, exportFormat)
  }
  
  const handleCalculate = () => {
    let result = ''
    
    switch(calcType) {
      case 'airchange':
        const achResult = GmpCalc.calculateAirChangeRate({
          roomVolume: parseFloat(calcInputs.volume) || 100,
          airFlow: parseFloat(calcInputs.flow) || 2000,
          gradeClass: calcInputs.grade || 'B'
        })
        result = `Stopnja menjave zraka: ${achResult.achRate.toFixed(1)} ACH\n\n${achResult.recommendation}`
        break
        
      case 'recovery':
        const recoveryResult = GmpCalc.calculateRecoveryTime({
          currentParticles: parseFloat(calcInputs.current) || 100000,
          targetParticles: parseFloat(calcInputs.target) || 3520,
          achRate: parseFloat(calcInputs.ach) || 25
        })
        result = recoveryResult.explanation
        break
        
      case 'disinfectant':
        const disinfResult = GmpCalc.calculateDisinfectantContactTime({
          type: calcInputs.disType || 'alcohol',
          surface: calcInputs.surface || 'floor',
          gradeClass: calcInputs.grade || 'B'
        })
        result = disinfResult.recommendation
        break
        
      case 'particles':
        const particleResult = GmpCalc.checkParticleLimits({
          gradeClass: calcInputs.grade || 'B',
          atRest: calcInputs.state === 'rest',
          size05um: parseFloat(calcInputs.p05) || 0,
          size50um: parseFloat(calcInputs.p50) || 0
        })
        result = particleResult.result
        break
        
      case 'pressure':
        const pressureResult = GmpCalc.checkDifferentialPressure({
          area: calcInputs.area || 'Aseptično območje',
          measureddP: parseFloat(calcInputs.dp) || 12,
          gradeClass: calcInputs.grade || 'A',
          adjacentGrade: calcInputs.adjacent || 'B'
        })
        result = pressureResult.result
        break
        
      case 'microbio':
        const microResult = GmpCalc.checkMicrobiologicalLimits({
          gradeClass: calcInputs.grade || 'B',
          method: calcInputs.method || 'settle-plate',
          count: parseFloat(calcInputs.count) || 0
        })
        result = microResult.result
        break
        
      case 'mediafill':
        const mediaResult = GmpCalc.evaluateMediaFill({
          totalUnits: parseInt(calcInputs.total) || 3000,
          contaminatedUnits: parseInt(calcInputs.contaminated) || 0
        })
        result = mediaResult.recommendation
        break
        
      case 'filterflow':
        const filterResult = GmpCalc.calculateFilterFlowRate({
          filterArea: parseFloat(calcInputs.filterArea) || 100,
          flowRate: parseFloat(calcInputs.flowRate) || 5,
          filterType: calcInputs.filterType || '0.22um'
        })
        result = filterResult.recommendation
        break
        
      case 'personnel':
        const personnelResult = GmpCalc.calculatePersonnelDensity({
          roomArea: parseFloat(calcInputs.roomArea) || 50,
          gradeClass: calcInputs.grade || 'B',
          simultaneousOperators: parseInt(calcInputs.operators) || 4
        })
        result = personnelResult.recommendation
        break
        
      case 'gowning':
        const gowningResult = GmpCalc.calculateGowningTime({
          gradeClass: calcInputs.grade || 'B',
          experience: calcInputs.experience || 'trained'
        })
        result = gowningResult.recommendation
        break
        
      case 'gaspurity':
        const gasResult = GmpCalc.checkGasPurity({
          gasType: calcInputs.gasType || 'nitrogen',
          oilContent: parseFloat(calcInputs.oil) || 0.005,
          waterDewPoint: parseFloat(calcInputs.dewpoint) || -45,
          particleCount: parseFloat(calcInputs.particles) || 300
        })
        result = gasResult.recommendation
        break
        
      case 'watertoc':
        const waterResult = GmpCalc.checkWaterTOC({
          tocReading: parseFloat(calcInputs.toc) || 400,
          waterType: calcInputs.waterType || 'purified'
        })
        result = waterResult.recommendation
        break
        
      case 'autoclave':
        const autoclaveResult = GmpCalc.validateAutoclaveCycle({
          temperature: parseFloat(calcInputs.temp) || 121,
          exposureTime: parseFloat(calcInputs.time) || 15,
          pressure: parseFloat(calcInputs.pressure) || 2.1,
          processType: calcInputs.processType || 'porous'
        })
        result = autoclaveResult.recommendation
        break
        
      case 'h2o2':
        const h2o2Result = GmpCalc.validateH2O2Decontamination({
          concentration: parseFloat(calcInputs.concentration) || 1000,
          exposureTime: parseFloat(calcInputs.time) || 20,
          humidity: parseFloat(calcInputs.humidity) || 40
        })
        result = h2o2Result.recommendation
        break
        
      case 'bioburden':
        const bioburdenResult = GmpCalc.calculateBioburdenSampleSize({
          batchSize: parseInt(calcInputs.batchSize) || 10000,
          riskLevel: calcInputs.risk || 'medium'
        })
        result = bioburdenResult.recommendation
        break
        
      case 'hepa':
        const hepaResult = GmpCalc.validateHEPAIntegrity({
          upstreamConcentration: parseFloat(calcInputs.upstream) || 1000000,
          downstreamConcentration: parseFloat(calcInputs.downstream) || 50,
          filterClass: calcInputs.filterClass || 'H14'
        })
        result = hepaResult.recommendation
        break
        
      case 'lyophilization':
        const lyoResult = GmpCalc.optimizeLyophilizationCycle({
          productTemp: parseFloat(calcInputs.productTemp) || -40,
          shelfTemp: parseFloat(calcInputs.shelfTemp) || -30,
          chamberPressure: parseFloat(calcInputs.pressure) || 100,
          freezingPoint: parseFloat(calcInputs.freezingPoint) || -35
        })
        result = lyoResult.recommendation
        break
        
      case 'vialwash':
        const vialResult = GmpCalc.evaluateVialWashing({
          injectionVolume: parseFloat(calcInputs.volume) || 7,
          injectionPressure: parseFloat(calcInputs.pressure) || 3,
          temperature: parseFloat(calcInputs.temp) || 75,
          washSteps: parseInt(calcInputs.steps) || 3
        })
        result = vialResult.recommendation
        break
        
      case 'tempmapping':
        const tempResult = GmpCalc.calculateTempMappingSensors({
          roomVolume: parseFloat(calcInputs.volume) || 100,
          gradeClass: calcInputs.grade || 'B'
        })
        result = tempResult.recommendation
        break
        
      case 'endotoxin':
        const endoResult = GmpCalc.calculateEndotoxinDilution({
          sampleConcentration: parseFloat(calcInputs.concentration) || 10,
          mvd: parseFloat(calcInputs.mvd) || 100,
          expectedEndotoxin: parseFloat(calcInputs.expectedEndotoxin) || 5
        })
        result = endoResult.recommendation
        break

      case 'airvelocity': {
        const r = GmpCalc.checkAirVelocity({ measuredVelocity: parseFloat(calcInputs.velocity) || 0.4 })
        result = r.recommendation
        break
      }
      case 'classsuggest': {
        const r = GmpCalc.suggestCleanroomClass({
          size05um: parseFloat(calcInputs.p05) || 0,
          size50um: parseFloat(calcInputs.p50) || 0,
          atRest: (calcInputs.state || 'rest') === 'rest'
        })
        result = r.explanation
        break
      }
      case 'settleplate': {
        const r = GmpCalc.calculateSettlePlateExposure({
          gradeClass: calcInputs.grade || 'B',
          expectedCFUPerHour: parseFloat(calcInputs.cfuPerHour) || 0.2
        })
        result = r.recommendation
        break
      }
      case 'aps': {
        const r = GmpCalc.evaluateAPS({ totalUnits: parseInt(calcInputs.total) || 3000, contaminationEvents: parseInt(calcInputs.events) || 0 })
        result = r.recommendation
        break
      }
      case 'cascade': {
        const r = GmpCalc.designPressureCascade({ rooms: parseInt(calcInputs.rooms) || 3, stepPa: parseFloat(calcInputs.step) || 12, startPa: parseFloat(calcInputs.start) || 45 })
        result = r.recommendation
        break
      }
      case 'recoveryleak': {
        const r = GmpCalc.calculateRecoveryWithLeak({ current: parseFloat(calcInputs.current) || 100000, target: parseFloat(calcInputs.target) || 3520, ach: parseFloat(calcInputs.ach) || 25, leakagePct: parseFloat(calcInputs.leak) || 10 })
        result = r.recommendation
        break
      }
      case 'rotation': {
        const r = GmpCalc.generateSanitationRotation({ weeks: parseInt(calcInputs.weeks) || 4, agentsCsv: calcInputs.agents || 'alcohol, sporicidal, oxidizing' })
        result = r.recommendation + '\n' + r.schedule.join('\n')
        break
      }
      case 'occupancy': {
        const r = GmpCalc.estimateOccupancyParticles({ operators: parseInt(calcInputs.operators) || 4, emissionPerMin: parseFloat(calcInputs.emission) || 1000, minutes: parseInt(calcInputs.minutes) || 30 })
        result = r.recommendation
        break
      }
      case 'filterlife': {
        const r = GmpCalc.predictFilterLife({ dpInitial: parseFloat(calcInputs.dpInitial) || 100, dpCurrent: parseFloat(calcInputs.dpCurrent) || 200, dpChangeout: parseFloat(calcInputs.dpChange) || 300, hoursUsed: parseInt(calcInputs.hours) || 1000 })
        result = r.recommendation
        break
      }
      case 'hvacbalance': {
        const r = GmpCalc.evaluateHVACBalance({ supply: parseFloat(calcInputs.supply) || 2000, exhaust: parseFloat(calcInputs.exhaust) || 1800 })
        result = r.recommendation
        break
      }
      case 'uafcoverage': {
        const r = GmpCalc.checkUAFCoverage({ workingWidth: parseFloat(calcInputs.working) || 0.6, coverageWidth: parseFloat(calcInputs.coverage) || 0.7 })
        result = r.recommendation
        break
      }
      case 'vhp': {
        const r = GmpCalc.validateVHP({ concentration: parseFloat(calcInputs.concentration) || 600, time: parseFloat(calcInputs.time) || 20, rh: parseFloat(calcInputs.rh) || 40 })
        result = r.recommendation
        break
      }
      case 'emplan': {
        const r = GmpCalc.planEMAirSamples({ areaM2: parseFloat(calcInputs.area) || 20, grade: (calcInputs.grade || 'B') })
        result = r.recommendation
        break
      }
      case 'intervention': {
        const r = GmpCalc.scoreInterventionRisk({ frequencyPerShift: parseFloat(calcInputs.freq) || 2, durationMin: parseFloat(calcInputs.duration) || 5, proximityCm: parseFloat(calcInputs.proximity) || 20 })
        result = r.recommendation
        break
      }
      case 'sal': {
        const r = GmpCalc.estimateSAL({ f0: parseFloat(calcInputs.f0) || 12, dValue: parseFloat(calcInputs.d) || 2, bioburden: parseFloat(calcInputs.n0) || 1000 })
        result = r.recommendation
        break
      }
      case 'aseptichold': {
        const r = GmpCalc.estimateAsepticHold({ temperatureC: parseFloat(calcInputs.temp) || 20, covered: (calcInputs.covered || 'yes') === 'yes' })
        result = r.recommendation
        break
      }
      case 'cleanhold': {
        const r = GmpCalc.estimateCleanHold({ temperatureC: parseFloat(calcInputs.temp) || 20, humidity: parseFloat(calcInputs.humidity) || 50 })
        result = r.recommendation
        break
      }
      case 'rotationscore': {
        const r = GmpCalc.scoreDisinfectantRotation({ agentsCsv: calcInputs.agents || 'alcohol, sporicidal, oxidizing' })
        result = r.recommendation
        break
      }
      case 'comfort': {
        const r = GmpCalc.checkComfortEnv({ temperatureC: parseFloat(calcInputs.temp) || 20, humidity: parseFloat(calcInputs.humidity) || 50 })
        result = r.recommendation
        break
      }
      case 'samplerlocs': {
        const r = GmpCalc.calculateSamplerLocations({ areaM2: parseFloat(calcInputs.area) || 20 })
        result = r.recommendation
        break
      }
    }
    
    setCalcResult(result)
  }
  
  return (
    <div style={{ padding: 16, display:'grid', gap:14 }}>
      <div style={{ display:'flex', gap:8, borderBottom:'1px solid rgba(124,58,237,0.25)', paddingBottom:8 }}>
        <button
          className={toolTab==='templates'? 'button active':'button'}
          onClick={()=> setToolTab('templates')}
          style={{ fontSize:13 }}
        >
          📄 Predloge dokumentov
        </button>
        <button
          className={toolTab==='calculator'? 'button active':'button'}
          onClick={()=> setToolTab('calculator')}
          style={{ fontSize:13 }}
        >
          🧮 GMP kalkulatorji
        </button>
      </div>
      
      {toolTab === 'templates' ? (
        <div style={{ display:'grid', gap:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Generator predlog dokumentov</div>
          <select 
            value={selectedTemplate} 
            onChange={(e)=> setSelectedTemplate(e.target.value)}
            style={{ padding:'10px 12px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8 }}
          >
            <option value="">Izberi tip predloge...</option>
            {Object.entries(templates).map(([key, config]) => (
              <option key={key} value={key}>{config.title}</option>
            ))}
          </select>
          
          {selectedTemplate && (
            <>
              <div style={{ border:'1px solid rgba(124,58,237,0.3)', borderRadius:10, padding:12, background:'rgba(124,58,237,0.06)' }}>
                <div style={{ fontWeight:600, marginBottom:8 }}>{templates[selectedTemplate].title}</div>
                <div style={{ color:'#94a3b8', fontSize:13, marginBottom:8 }}>
                  Tip: {templates[selectedTemplate].type.toUpperCase()} | Kategorija: {templates[selectedTemplate].category}
                </div>
                <div style={{ color:'#cbd5e1', fontSize:13 }}>
                  Sekcije: {templates[selectedTemplate].sections.join(', ')}
                </div>
              </div>
              
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <label style={{ fontSize:13, color:'#cbd5e1' }}>Format:</label>
                <select 
                  value={exportFormat} 
                  onChange={(e)=> setExportFormat(e.target.value as ExportFormat)}
                  style={{ padding:'8px 12px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8, flex:1 }}
                >
                  <option value="docx">📄 Word dokument (.docx)</option>
                  <option value="pdf">📕 PDF dokument (.pdf)</option>
                </select>
              </div>
            </>
          )}
          
          <button 
            className="button" 
            onClick={handleGenerateTemplate}
            disabled={!selectedTemplate}
            style={{ justifySelf:'start' }}
          >
            📥 Generiraj in prenesi {exportFormat === 'docx' ? 'DOCX' : 'PDF'}
          </button>
          
          <div style={{ fontSize:12, color:'#64748b', marginTop:8 }}>
            💡 Predloge so pripravljene kot profesionalni dokumenti z vsemi potrebnimi sekcijami po GMP Annex 1 standardih.
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12, maxHeight: fullScreen ? '78vh' : '48vh', overflow:'auto' }}>
          <div style={{ fontWeight:700, fontSize:15 }}>GMP Kalkulatorji in Validacijska orodja</div>
          
          <select 
            value={calcType} 
            onChange={(e)=> { setCalcType(e.target.value); setCalcResult('') }}
            style={{ padding:'10px 12px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8 }}
          >
            <option value="airchange">1. Stopnja menjave zraka (ACH)</option>
            <option value="recovery">2. Čas obnove čistosti</option>
            <option value="disinfectant">3. Časi dezinfekcije</option>
            <option value="particles">4. Preverjanje delcev</option>
            <option value="pressure">5. Diferencialni tlak</option>
            <option value="microbio">6. Mikrobiološke meje</option>
            <option value="mediafill">7. Media Fill evaluacija</option>
            <option value="filterflow">8. Pretok sterilnih filtrov</option>
            <option value="personnel">9. Gostota osebja v prostoru</option>
            <option value="gowning">10. Čas oblačenja</option>
            <option value="gaspurity">11. Čistost komprimiranega plina</option>
            <option value="watertoc">12. TOC v vodi (WFI/Purified)</option>
            <option value="autoclave">13. Validacija avtoklavnega cikla</option>
            <option value="h2o2">14. H₂O₂ dekontaminacija izolatorja</option>
            <option value="bioburden">15. Velikost vzorca bioburden</option>
            <option value="hepa">16. HEPA filter integrity test</option>
            <option value="lyophilization">17. Optimizacija liofilizacije</option>
            <option value="vialwash">18. Učinkovitost pranja vial</option>
            <option value="tempmapping">19. Temperature mapping senzorji</option>
            <option value="endotoxin">20. Dilucija endotoksin testa</option>
            <option value="airvelocity">21. Hitrost unidirekcijskega toka (Grade A)</option>
            <option value="classsuggest">22. Predlog razreda iz meritev delcev</option>
            <option value="settleplate">23. Maks. čas izpostavitve settle-plate</option>
            <option value="aps">24. Aseptic Process Simulation sprejemljivost</option>
            <option value="cascade">25. Načrt kaskade diferencialnih tlakov</option>
            <option value="recoveryleak">26. Čas obnove z upoštevanjem puščanj</option>
            <option value="rotation">27. Rotacija sanitacije – urnik</option>
            <option value="occupancy">28. Ocena izpusta delcev (zasedenost)</option>
            <option value="filterlife">29. Življenjska doba filtra (ΔP)</option>
            <option value="hvacbalance">30. Ravnotežje HVAC (supply vs exhaust)</option>
            <option value="uafcoverage">31. Pokritost toka nad kritičnim območjem</option>
            <option value="vhp">32. Validacija VHP cikla</option>
            <option value="emplan">33. EM plan – št. točk (zrak)</option>
            <option value="intervention">34. Ocena tveganja intervencij</option>
            <option value="sal">35. Ocena SAL iz F0 in D-vrednosti</option>
            <option value="aseptichold">36. Aseptični hold-time (komponente)</option>
            <option value="cleanhold">37. Clean hold-time (oprema)</option>
            <option value="rotationscore">38. Pokritost rotacije dezinfekcije</option>
            <option value="comfort">39. Udobje osebja (T/RH)</option>
            <option value="samplerlocs">40. Lokacije za vzorčenje delcev</option>
          </select>
          
          <CalculatorInputs calcType={calcType} calcInputs={calcInputs} setCalcInputs={setCalcInputs} />
          
          <button className="button" onClick={handleCalculate}>🔬 Izračunaj</button>
          
          {calcResult && (
            <div style={{ border:'1px solid rgba(124,58,237,0.3)', borderRadius:10, padding:12, background:'rgba(124,58,237,0.06)', whiteSpace:'pre-wrap', fontFamily:'monospace', fontSize:13 }}>
              {calcResult}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Calculator Inputs Component
function CalculatorInputs({ calcType, calcInputs, setCalcInputs }: any) {
  const update = (key: string, value: any) => setCalcInputs((prev: any) => ({ ...prev, [key]: value }))
  
  const inputStyle = { padding:'8px 10px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:6, width:'100%' }
  
  switch(calcType) {
    case 'airchange':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Prostornina prostora (m³): <input type="number" value={calcInputs.volume || ''} onChange={(e)=> update('volume', e.target.value)} style={inputStyle} /></label>
          <label>Pretok zraka (m³/h): <input type="number" value={calcInputs.flow || ''} onChange={(e)=> update('flow', e.target.value)} style={inputStyle} /></label>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
        </div>
      )
    
    case 'recovery':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Trenutno število delcev: <input type="number" value={calcInputs.current || ''} onChange={(e)=> update('current', e.target.value)} style={inputStyle} /></label>
          <label>Cilj število delcev: <input type="number" value={calcInputs.target || ''} onChange={(e)=> update('target', e.target.value)} style={inputStyle} /></label>
          <label>ACH (menjave/uro): <input type="number" value={calcInputs.ach || ''} onChange={(e)=> update('ach', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'disinfectant':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Tip dezinfekcijskega sredstva: <select value={calcInputs.disType || 'alcohol'} onChange={(e)=> update('disType', e.target.value)} style={inputStyle}>
            <option value="alcohol">Alkohol (70%)</option>
            <option value="sporicidal">Sporicidno</option>
            <option value="oxidizing">Oksidirajče</option>
          </select></label>
          <label>Površina: <select value={calcInputs.surface || 'floor'} onChange={(e)=> update('surface', e.target.value)} style={inputStyle}>
            <option value="floor">Tla</option>
            <option value="wall">Stene</option>
            <option value="equipment">Oprema</option>
            <option value="pass-through">Pass-through</option>
          </select></label>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
        </div>
      )
    
    case 'particles':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
          <label>Stanje: <select value={calcInputs.state || 'rest'} onChange={(e)=> update('state', e.target.value)} style={inputStyle}>
            <option value="rest">At Rest</option>
            <option value="operation">In Operation</option>
          </select></label>
          <label>Delci ≥0.5 µm: <input type="number" value={calcInputs.p05 || ''} onChange={(e)=> update('p05', e.target.value)} style={inputStyle} /></label>
          <label>Delci ≥5.0 µm: <input type="number" value={calcInputs.p50 || ''} onChange={(e)=> update('p50', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'pressure':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Območje: <input type="text" value={calcInputs.area || ''} onChange={(e)=> update('area', e.target.value)} style={inputStyle} placeholder="npr. Aseptično polnilnica" /></label>
          <label>Izmerjen dP (Pa): <input type="number" value={calcInputs.dp || ''} onChange={(e)=> update('dp', e.target.value)} style={inputStyle} /></label>
          <label>Grade območja: <select value={calcInputs.grade || 'A'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
          <label>Sosednji Grade: <select value={calcInputs.adjacent || 'B'} onChange={(e)=> update('adjacent', e.target.value)} style={inputStyle}>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
            <option value="unclassified">Neklasificirano</option>
          </select></label>
        </div>
      )
    
    case 'microbio':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
          <label>Metoda: <select value={calcInputs.method || 'settle-plate'} onChange={(e)=> update('method', e.target.value)} style={inputStyle}>
            <option value="settle-plate">Settle plate</option>
            <option value="active-air">Active air</option>
            <option value="surface">Surface</option>
            <option value="glove">Glove print</option>
          </select></label>
          <label>Število CFU: <input type="number" value={calcInputs.count || ''} onChange={(e)=> update('count', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'mediafill':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Skupno število enot: <input type="number" value={calcInputs.total || ''} onChange={(e)=> update('total', e.target.value)} style={inputStyle} placeholder="npr. 3000" /></label>
          <label>Kontaminirane enote: <input type="number" value={calcInputs.contaminated || ''} onChange={(e)=> update('contaminated', e.target.value)} style={inputStyle} placeholder="0" /></label>
        </div>
      )
    
    case 'filterflow':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Površina filtra (cm²): <input type="number" value={calcInputs.filterArea || ''} onChange={(e)=> update('filterArea', e.target.value)} style={inputStyle} /></label>
          <label>Pretok (L/min): <input type="number" value={calcInputs.flowRate || ''} onChange={(e)=> update('flowRate', e.target.value)} style={inputStyle} /></label>
          <label>Tip filtra: <select value={calcInputs.filterType || '0.22um'} onChange={(e)=> update('filterType', e.target.value)} style={inputStyle}>
            <option value="0.22um">0.22 µm</option>
            <option value="0.45um">0.45 µm</option>
          </select></label>
        </div>
      )
    
    case 'personnel':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Površina prostora (m²): <input type="number" value={calcInputs.roomArea || ''} onChange={(e)=> update('roomArea', e.target.value)} style={inputStyle} /></label>
          <label>Število operaterjev: <input type="number" value={calcInputs.operators || ''} onChange={(e)=> update('operators', e.target.value)} style={inputStyle} /></label>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
        </div>
      )
    
    case 'gowning':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A/B</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
          <label>Izkušenost: <select value={calcInputs.experience || 'trained'} onChange={(e)=> update('experience', e.target.value)} style={inputStyle}>
            <option value="novice">Začetnik</option>
            <option value="trained">Usposobljen</option>
            <option value="expert">Strokovnjak</option>
          </select></label>
        </div>
      )
    
    case 'gaspurity':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Tip plina: <select value={calcInputs.gasType || 'nitrogen'} onChange={(e)=> update('gasType', e.target.value)} style={inputStyle}>
            <option value="nitrogen">Dušik</option>
            <option value="compressed-air">Komprimiran zrak</option>
            <option value="co2">CO₂</option>
          </select></label>
          <label>Vsebnost olja (mg/m³): <input type="number" step="0.001" value={calcInputs.oil || ''} onChange={(e)=> update('oil', e.target.value)} style={inputStyle} /></label>
          <label>Rosišče (°C): <input type="number" value={calcInputs.dewpoint || ''} onChange={(e)=> update('dewpoint', e.target.value)} style={inputStyle} /></label>
          <label>Delci (št/m³): <input type="number" value={calcInputs.particles || ''} onChange={(e)=> update('particles', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'watertoc':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>TOC vrednost (ppb): <input type="number" value={calcInputs.toc || ''} onChange={(e)=> update('toc', e.target.value)} style={inputStyle} /></label>
          <label>Tip vode: <select value={calcInputs.waterType || 'purified'} onChange={(e)=> update('waterType', e.target.value)} style={inputStyle}>
            <option value="purified">Purified Water</option>
            <option value="wfi">WFI (Water for Injection)</option>
          </select></label>
        </div>
      )
    
    case 'autoclave':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Temperatura (°C): <input type="number" value={calcInputs.temp || ''} onChange={(e)=> update('temp', e.target.value)} style={inputStyle} /></label>
          <label>Čas ekspozicije (min): <input type="number" value={calcInputs.time || ''} onChange={(e)=> update('time', e.target.value)} style={inputStyle} /></label>
          <label>Tlak (bar): <input type="number" step="0.1" value={calcInputs.pressure || ''} onChange={(e)=> update('pressure', e.target.value)} style={inputStyle} /></label>
          <label>Tip procesa: <select value={calcInputs.processType || 'porous'} onChange={(e)=> update('processType', e.target.value)} style={inputStyle}>
            <option value="porous">Porous load</option>
            <option value="liquid">Liquid</option>
            <option value="wrapped">Wrapped goods</option>
          </select></label>
        </div>
      )
    
    case 'h2o2':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Koncentracija H₂O₂ (ppm): <input type="number" value={calcInputs.concentration || ''} onChange={(e)=> update('concentration', e.target.value)} style={inputStyle} /></label>
          <label>Čas ekspozicije (min): <input type="number" value={calcInputs.time || ''} onChange={(e)=> update('time', e.target.value)} style={inputStyle} /></label>
          <label>Vlažnost (% RH): <input type="number" value={calcInputs.humidity || ''} onChange={(e)=> update('humidity', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'bioburden':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Velikost serije: <input type="number" value={calcInputs.batchSize || ''} onChange={(e)=> update('batchSize', e.target.value)} style={inputStyle} /></label>
          <label>Raven tveganja: <select value={calcInputs.risk || 'medium'} onChange={(e)=> update('risk', e.target.value)} style={inputStyle}>
            <option value="low">Nizka</option>
            <option value="medium">Srednja</option>
            <option value="high">Visoka</option>
          </select></label>
        </div>
      )
    
    case 'hepa':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Upstream delci (delcev/L): <input type="number" value={calcInputs.upstream || ''} onChange={(e)=> update('upstream', e.target.value)} style={inputStyle} /></label>
          <label>Downstream delci (delcev/L): <input type="number" value={calcInputs.downstream || ''} onChange={(e)=> update('downstream', e.target.value)} style={inputStyle} /></label>
          <label>HEPA razred: <select value={calcInputs.filterClass || 'H14'} onChange={(e)=> update('filterClass', e.target.value)} style={inputStyle}>
            <option value="H13">H13 (≥99.95%)</option>
            <option value="H14">H14 (≥99.995%)</option>
            <option value="U15">U15 (≥99.9995%)</option>
          </select></label>
        </div>
      )
    
    case 'lyophilization':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Temp. produkta (°C): <input type="number" value={calcInputs.productTemp || ''} onChange={(e)=> update('productTemp', e.target.value)} style={inputStyle} /></label>
          <label>Temp. police (°C): <input type="number" value={calcInputs.shelfTemp || ''} onChange={(e)=> update('shelfTemp', e.target.value)} style={inputStyle} /></label>
          <label>Tlak komore (mTorr): <input type="number" value={calcInputs.pressure || ''} onChange={(e)=> update('pressure', e.target.value)} style={inputStyle} /></label>
          <label>Točka zmrzovanja (°C): <input type="number" value={calcInputs.freezingPoint || ''} onChange={(e)=> update('freezingPoint', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'vialwash':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Volumen injiciranja (mL): <input type="number" value={calcInputs.volume || ''} onChange={(e)=> update('volume', e.target.value)} style={inputStyle} /></label>
          <label>Tlak (bar): <input type="number" step="0.1" value={calcInputs.pressure || ''} onChange={(e)=> update('pressure', e.target.value)} style={inputStyle} /></label>
          <label>Temperatura (°C): <input type="number" value={calcInputs.temp || ''} onChange={(e)=> update('temp', e.target.value)} style={inputStyle} /></label>
          <label>Število korakov: <input type="number" value={calcInputs.steps || ''} onChange={(e)=> update('steps', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'tempmapping':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Prostornina prostora (m³): <input type="number" value={calcInputs.volume || ''} onChange={(e)=> update('volume', e.target.value)} style={inputStyle} /></label>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
        </div>
      )
    
    case 'endotoxin':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Koncentracija vzorca (mg/mL): <input type="number" step="0.1" value={calcInputs.concentration || ''} onChange={(e)=> update('concentration', e.target.value)} style={inputStyle} /></label>
          <label>MVD: <input type="number" value={calcInputs.mvd || ''} onChange={(e)=> update('mvd', e.target.value)} style={inputStyle} /></label>
          <label>Pričakovani endotoksin (EU/mL): <input type="number" step="0.1" value={calcInputs.expectedEndotoxin || ''} onChange={(e)=> update('expectedEndotoxin', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    
    case 'airvelocity':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Izmerjena hitrost (m/s): <input type="number" step="0.01" value={calcInputs.velocity || ''} onChange={(e)=> update('velocity', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'classsuggest':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Delci ≥0.5 µm: <input type="number" value={calcInputs.p05 || ''} onChange={(e)=> update('p05', e.target.value)} style={inputStyle} /></label>
          <label>Delci ≥5.0 µm: <input type="number" value={calcInputs.p50 || ''} onChange={(e)=> update('p50', e.target.value)} style={inputStyle} /></label>
          <label>Stanje: <select value={calcInputs.state || 'rest'} onChange={(e)=> update('state', e.target.value)} style={inputStyle}>
            <option value="rest">At Rest</option>
            <option value="operation">In Operation</option>
          </select></label>
        </div>
      )
    case 'settleplate':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
          <label>Pričakovani CFU/uro: <input type="number" step="0.1" value={calcInputs.cfuPerHour || ''} onChange={(e)=> update('cfuPerHour', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'aps':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Skupno enot: <input type="number" value={calcInputs.total || ''} onChange={(e)=> update('total', e.target.value)} style={inputStyle} /></label>
          <label>Kontaminacijski dogodki: <input type="number" value={calcInputs.events || ''} onChange={(e)=> update('events', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'cascade':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Število prostorov: <input type="number" value={calcInputs.rooms || ''} onChange={(e)=> update('rooms', e.target.value)} style={inputStyle} /></label>
          <label>Korak tlaka (Pa): <input type="number" value={calcInputs.step || ''} onChange={(e)=> update('step', e.target.value)} style={inputStyle} /></label>
          <label>Začetni tlak (Pa): <input type="number" value={calcInputs.start || ''} onChange={(e)=> update('start', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'recoveryleak':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Trenutno število delcev: <input type="number" value={calcInputs.current || ''} onChange={(e)=> update('current', e.target.value)} style={inputStyle} /></label>
          <label>Cilj število delcev: <input type="number" value={calcInputs.target || ''} onChange={(e)=> update('target', e.target.value)} style={inputStyle} /></label>
          <label>ACH (menjave/uro): <input type="number" value={calcInputs.ach || ''} onChange={(e)=> update('ach', e.target.value)} style={inputStyle} /></label>
          <label>Puščanja (%): <input type="number" step="0.1" value={calcInputs.leak || ''} onChange={(e)=> update('leak', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'rotation':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Tednov: <input type="number" value={calcInputs.weeks || ''} onChange={(e)=> update('weeks', e.target.value)} style={inputStyle} /></label>
          <label>Agensi (vejica): <input type="text" value={calcInputs.agents || ''} onChange={(e)=> update('agents', e.target.value)} style={inputStyle} placeholder="alcohol, sporicidal, oxidizing" /></label>
        </div>
      )
    case 'occupancy':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Število operaterjev: <input type="number" value={calcInputs.operators || ''} onChange={(e)=> update('operators', e.target.value)} style={inputStyle} /></label>
          <label>Emisija delcev/operater/min: <input type="number" value={calcInputs.emission || ''} onChange={(e)=> update('emission', e.target.value)} style={inputStyle} /></label>
          <label>Trajanje (min): <input type="number" value={calcInputs.minutes || ''} onChange={(e)=> update('minutes', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'filterlife':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Začetni ΔP (Pa): <input type="number" value={calcInputs.dpInitial || ''} onChange={(e)=> update('dpInitial', e.target.value)} style={inputStyle} /></label>
          <label>Trenutni ΔP (Pa): <input type="number" value={calcInputs.dpCurrent || ''} onChange={(e)=> update('dpCurrent', e.target.value)} style={inputStyle} /></label>
          <label>Meja zamenjave ΔP (Pa): <input type="number" value={calcInputs.dpChange || ''} onChange={(e)=> update('dpChange', e.target.value)} style={inputStyle} /></label>
          <label>Ure uporabe: <input type="number" value={calcInputs.hours || ''} onChange={(e)=> update('hours', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'hvacbalance':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Supply (m³/h): <input type="number" value={calcInputs.supply || ''} onChange={(e)=> update('supply', e.target.value)} style={inputStyle} /></label>
          <label>Exhaust (m³/h): <input type="number" value={calcInputs.exhaust || ''} onChange={(e)=> update('exhaust', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'uafcoverage':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Širina delovnega območja (m): <input type="number" step="0.01" value={calcInputs.working || ''} onChange={(e)=> update('working', e.target.value)} style={inputStyle} /></label>
          <label>Širina pokritosti (m): <input type="number" step="0.01" value={calcInputs.coverage || ''} onChange={(e)=> update('coverage', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'vhp':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Koncentracija (ppm): <input type="number" value={calcInputs.concentration || ''} onChange={(e)=> update('concentration', e.target.value)} style={inputStyle} /></label>
          <label>Čas (min): <input type="number" value={calcInputs.time || ''} onChange={(e)=> update('time', e.target.value)} style={inputStyle} /></label>
          <label>Vlažnost (%RH): <input type="number" value={calcInputs.rh || ''} onChange={(e)=> update('rh', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'emplan':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Površina (m²): <input type="number" value={calcInputs.area || ''} onChange={(e)=> update('area', e.target.value)} style={inputStyle} /></label>
          <label>Grade: <select value={calcInputs.grade || 'B'} onChange={(e)=> update('grade', e.target.value)} style={inputStyle}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="D">Grade D</option>
          </select></label>
        </div>
      )
    case 'intervention':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Pogostost/izmena: <input type="number" value={calcInputs.freq || ''} onChange={(e)=> update('freq', e.target.value)} style={inputStyle} /></label>
          <label>Trajanje (min): <input type="number" value={calcInputs.duration || ''} onChange={(e)=> update('duration', e.target.value)} style={inputStyle} /></label>
          <label>Razdalja (cm): <input type="number" value={calcInputs.proximity || ''} onChange={(e)=> update('proximity', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'sal':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>F0: <input type="number" step="0.1" value={calcInputs.f0 || ''} onChange={(e)=> update('f0', e.target.value)} style={inputStyle} /></label>
          <label>D-vrednost (min): <input type="number" step="0.1" value={calcInputs.d || ''} onChange={(e)=> update('d', e.target.value)} style={inputStyle} /></label>
          <label>Začetni bioburden (N0): <input type="number" value={calcInputs.n0 || ''} onChange={(e)=> update('n0', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'aseptichold':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Temperatura (°C): <input type="number" value={calcInputs.temp || ''} onChange={(e)=> update('temp', e.target.value)} style={inputStyle} /></label>
          <label>Pokrito: <select value={calcInputs.covered || 'yes'} onChange={(e)=> update('covered', e.target.value)} style={inputStyle}>
            <option value="yes">Da</option>
            <option value="no">Ne</option>
          </select></label>
        </div>
      )
    case 'cleanhold':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Temperatura (°C): <input type="number" value={calcInputs.temp || ''} onChange={(e)=> update('temp', e.target.value)} style={inputStyle} /></label>
          <label>Vlažnost (%RH): <input type="number" value={calcInputs.humidity || ''} onChange={(e)=> update('humidity', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'rotationscore':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Agensi (vejica): <input type="text" value={calcInputs.agents || ''} onChange={(e)=> update('agents', e.target.value)} style={inputStyle} placeholder="alcohol, sporicidal, oxidizing" /></label>
        </div>
      )
    case 'comfort':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Temperatura (°C): <input type="number" value={calcInputs.temp || ''} onChange={(e)=> update('temp', e.target.value)} style={inputStyle} /></label>
          <label>Vlažnost (%RH): <input type="number" value={calcInputs.humidity || ''} onChange={(e)=> update('humidity', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    case 'samplerlocs':
      return (
        <div style={{ display:'grid', gap:10 }}>
          <label>Površina (m²): <input type="number" value={calcInputs.area || ''} onChange={(e)=> update('area', e.target.value)} style={inputStyle} /></label>
        </div>
      )
    default:
      return null
  }
}

// Helper functions
function buildIndex(lessons: Lesson[]) {
  return buildRows(lessons)
}

function search(rows: { text: string }[], query: string) {
  if (!query.trim()) return [] as number[]
  const q = query.toLowerCase().split(/\s+/).filter(Boolean)
  // Score each row by term frequency
  const scores = rows.map((r, i) => {
    const t = r.text.toLowerCase()
    let s = 0
    for (const term of q) {
      if (t.includes(term)) s += 1
    }
    return { i, s }
  })
  return scores
    .filter(o=>o.s>0)
    .sort((a,b)=> b.s - a.s)
    .slice(0, 12)
    .map(o=>o.i)

}


export default function ProfessorAnnex() {
  const { isAuthenticated } = useAuth()
  
  // Ne prikaži komponente, če uporabnik ni prijavljen
  if (!isAuthenticated) return null

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [rows, setRows] = React.useState<Row[]>([])
  const [ranked, setRanked] = React.useState<ReturnType<typeof rankRows>>([])
  const [answer, setAnswer] = React.useState<null | { text: string; citations: { title: string; lessonId: number; section?: string; slug?: string }[] }>(null)
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'qa'|'news'|'tools'>('qa')
  const [toolTab, setToolTab] = React.useState<'templates'|'calculator'>('templates')
  const [scope, setScope] = React.useState<'local'|'global'|'hybrid'>('local')
  const [unread, setUnread] = React.useState(0)
  const { language } = useLanguage()
  const [lessonById, setLessonById] = React.useState<Record<number, Lesson>>({})
  const [thinking, setThinking] = React.useState(false)
  const [answering, setAnswering] = React.useState(false)
  const [newsCategory, setNewsCategory] = React.useState<'annex1' | 'fda' | 'gxp'>('annex1')
  const [unreadByCategory, setUnreadByCategory] = React.useState<Record<string, number>>({ annex1: 0, fda: 0, gxp: 0 })
  const [refreshing, setRefreshing] = React.useState(false)
  const [fullScreen, setFullScreen] = React.useState(false)
  const [expandedNews, setExpandedNews] = React.useState<Set<string>>(new Set())
  const [sourceToggles, setSourceToggles] = React.useState({
    annex1: true,
    iso: true,
    mhra: true,
    pics: true,
    who: false,
    fda: true,
    internal: true,
  })
  const [chatMode, setChatMode] = React.useState<'simple' | 'chat'>('simple')
  const [conversation, setConversation] = React.useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [chatting, setChatting] = React.useState(false)
  const [chatAvailable, setChatAvailable] = React.useState(false)

  React.useEffect(()=>{
    // Check if backend has Gemini configured
    ;(async ()=>{
      try {
        const ok = await isChatAvailable()
        setChatAvailable(ok)
      } catch {
        setChatAvailable(false)
      }
    })()
  },[])

  React.useEffect(()=>{
    let alive = true
    ;(async ()=>{
      setLoading(true)
      setThinking(true)
      try {
        const lessons = await cms.fetchLessons(language)
        const withQuiz = lessons.filter(l=> l && (l.developmentAndExplanation || l.practicalChallenges || l.improvementIdeas))
        const idx = buildIndex(withQuiz)
        if (alive) setRows(idx)
        if (alive) {
          const map: Record<number, Lesson> = {}
          lessons.forEach(l=> { map[l.id] = l })
          setLessonById(map)
        }
      } finally {
        if (alive) { setLoading(false); setThinking(false) }
      }
    })()
    return ()=>{ alive = false }
  },[language])
  // Seed demo news on first mount, compute unread count, and conditionally auto-refresh from backend
  React.useEffect(()=>{
    seedNewsIfEmpty()
    const updateUnread = () => {
      const a1 = getNewsByCategory('annex1').filter((i: NewsItem)=>!i.read).length
      const fd = getNewsByCategory('fda').filter((i: NewsItem)=>!i.read).length
      const gx = getNewsByCategory('gxp').filter((i: NewsItem)=>!i.read).length
      setUnreadByCategory({ annex1: a1, fda: fd, gxp: gx })
      setUnread(a1 + fd + gx)
    }
    updateUnread()
    
    // Auto-refresh from backend on mount if stale
    ;(async ()=>{
      try {
        if (isNewsStale()) {
          await refreshFromRemote()
          updateUnread()
        }
      } catch (e) {
        console.warn('Auto-refresh failed:', e)
      }
    })()
  },[])

  // Exit fullscreen with ESC
  React.useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullScreen) setFullScreen(false)
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [fullScreen])

  React.useEffect(()=>{
    const id = setTimeout(()=>{
      if (chatMode === 'chat') { setRanked([]); setAnswer(null); setAnswering(false); return }
      if (!query.trim()) { setRanked([]); setAnswer(null); setAnswering(false); return }
      setAnswering(true)
      // 1) Try FAQ
      const faq = matchFAQ(query, language)
      if (faq) {
        setRanked([])
        setAnswer({ text: faq.answer, citations: faq.citations.map(c=>({ title: lessonById[c.lessonId]?.title || `Lekcija ${c.lessonId}`, lessonId: c.lessonId, section: c.section, slug: lessonById[c.lessonId]?.slug })) })
        setAnswering(false)
        return
      }
      const doLocal = async () => {
        // Use rankRows to produce Ranked[] with scores
        const rankedResults = rankRows(rows, query)
        setRanked(rankedResults)
        const top = rankedResults.slice(0,3)
        if (top.length>0) {
          const text = [
            'Tukaj je povzetek, ki ti bo pomagal:',
            '',
            summarize(top, 3),
          ].join('\n')
          setAnswer({ text, citations: collectCitations(top) })
        }
        return top.length>0
      }

      const doGlobal = async () => {
        try {
          const activeSources = Object.entries(sourceToggles).filter(([,v])=>v).map(([k])=>k)
          // Try vector knowledge first (Cosmos DB)
          const vector = await askVectorKnowledge(query, 5, activeSources)
          const text = [vector.answer, '', 'Viri:', ...vector.citations.map(c=>`• ${c.title} — ${c.url}`)].join('\n')
          setAnswer({ text, citations: [] })
          return true
        } catch (e) {
          console.warn('Vector knowledge failed', e)
          // Fallback to lightweight HTML fetcher
          try {
            const global = await askGlobalKnowledge(query, 5)
            const text = [global.answer, '', 'Viri:', ...global.citations.map(c=>`• ${c.title} — ${c.url}`)].join('\n')
            setAnswer({ text, citations: [] })
            return true
          } catch (e2) {
            console.warn('Global knowledge failed', e2)
            return false
          }
        }
      }

      ;(async ()=>{
        let resolved = false
        if (scope === 'global') {
          resolved = await doGlobal()
          if (!resolved) resolved = await doLocal()
        } else if (scope === 'hybrid') {
          // Try local first for speed, then enrich with global
          resolved = await doLocal()
          const ok = await doGlobal()
          resolved = resolved || ok
        } else {
          resolved = await doLocal()
        }
        if (!resolved) {
          setAnswer({ text: 'Ni dovolj rezultatov. Poskusi bolj specifičen izraz ali preklopi na Globalne vire.', citations: [] })
        }
        setAnswering(false)
      })()
    }, 200)
    return ()=> clearTimeout(id)
  },[rows, query, language, scope, chatMode])

  // Derive avatar emotion from assistant context
  const emotion: Parameters<typeof ProfessorAvatar>[0]['emotion'] = (answering)
    ? 'speaking'
    : (thinking || loading)
    ? 'thinking'
    : !query
    ? 'neutral'
    : (answer && answer.citations && answer.citations.length>0) || (ranked && ranked.length>0)
    ? 'happy'
    : 'sad'

  const handleOpen = () => {
    setOpen(o=>!o)
  }

  const newsByCat = getNewsByCategory(newsCategory)

  // Chat handler
  const handleChatAsk = async () => {
    if (!query.trim()) return
    setChatting(true)
    setAnswer(null)
    try {
      const history: ChatMessage[] = [...conversation, { role: 'user', content: query }]
      const result = await chatCompletion(history)
      setConversation([...history, { role: 'assistant', content: result.answer }])
      setAnswer({ text: result.answer, citations: [] })
      setQuery('')
    } catch (e: any) {
      setAnswer({ text: e.message || 'Chat napaka', citations: [] })
    } finally {
      setChatting(false)
    }
  }

  return (
    <>
      {/* Floating Avatar Button */}
      <motion.button
        onClick={handleOpen}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 32,
          left: 32,
          width: 102,
          height: 102,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: '3px solid rgba(255,255,255,0.2)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          zIndex: 1100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}
        title="Profesor Annex"
      >
        <ProfessorAvatar emotion={emotion} size={84} />
        {unread>0 && (
          <span style={{position:'absolute', top:-4, right:-4, background:'#ef4444', color:'#fff', fontSize:12, borderRadius:999, padding:'2px 6px', border:'2px solid #011', boxShadow:'0 0 0 2px #7c3aed'}}>{unread}</span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1400 }}
            onClick={()=> setOpen(false)}
          >
            <motion.div
              onClick={(e)=>e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type:'spring', damping: 20, stiffness: 240 }}
              style={fullScreen ? {
                position:'absolute', inset: 24,
                background:'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
                border:'2px solid rgba(124,58,237,0.5)', borderRadius:20, overflow:'hidden',
                boxShadow:'0 30px 70px rgba(124,58,237,0.3), 0 10px 30px rgba(0,0,0,0.5)'
              } : {
                position:'absolute', bottom: 130, left: 32, width: 'min(680px, 94vw)',
                background:'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)', border:'2px solid rgba(124,58,237,0.5)', borderRadius:20, overflow:'hidden', boxShadow:'0 30px 70px rgba(124,58,237,0.3), 0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'2px solid rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.08)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <ProfessorAvatar emotion={emotion} size={54} />
                  <div>
                    <div style={{ fontWeight:800, fontSize:18, background:'linear-gradient(90deg, #a78bfa, #06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Profesor Annex</div>
                    <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>GMP Annex 1 pomočnik</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <button className={activeTab==='qa'? 'button active':'button'} onClick={()=>setActiveTab('qa')}>Vprašanja</button>
                  <button className={activeTab==='news'? 'button active':'button'} onClick={()=>setActiveTab('news')}>Novosti {unread>0 && `(${unread})`}</button>
                  <button className={activeTab==='tools'? 'button active':'button'} onClick={()=>setActiveTab('tools')}>Orodja</button>
                  <button className={'button'} onClick={()=> setFullScreen(fs=>!fs)} title={fullScreen? 'Izhod iz celozaslonskega' : 'Celozaslonski način'}>
                    {fullScreen ? '🗗 Izhod' : '⛶ Celozaslonsko'}
                  </button>
                  {activeTab==='qa' && (
                    <div style={{ marginLeft: 8, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:'#94a3b8', fontSize:12 }}>Način:</span>
                      <span style={{ padding:'6px 8px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8, fontSize:12 }}>Enostavno</span>
                      <span style={{ color:'#94a3b8', fontSize:12 }}>Viri:</span>
                      <select value={scope} onChange={e=> setScope(e.target.value as any)} style={{ padding:'6px 8px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8, fontSize:12 }}>
                        <option value="local">Lokalni (v aplikaciji)</option>
                        <option value="global">Globalni (Annex 1 + splet)</option>
                        <option value="hybrid">Hibrid (Lokalni + Globalni)</option>
                      </select>
                      {scope !== 'local' && (
                        <div style={{ display:'flex', gap:8, marginLeft:8, alignItems:'center', flexWrap:'wrap', maxWidth: 420 }}>
                          {[
                            { key:'annex1', label:'Annex 1' },
                            { key:'iso', label:'ISO' },
                            { key:'mhra', label:'MHRA' },
                            { key:'pics', label:'PIC/S' },
                            { key:'who', label:'WHO' },
                            { key:'fda', label:'FDA' },
                            { key:'internal', label:'Internal' },
                          ].map(s => (
                            <label key={s.key} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#cbd5e1', background:'rgba(2,6,23,0.5)', border:'1px solid rgba(148,163,184,0.25)', padding:'4px 8px', borderRadius:8 }}>
                              <input type="checkbox" checked={(sourceToggles as any)[s.key]} onChange={(e)=> setSourceToggles(prev=> ({ ...prev, [s.key]: e.target.checked }))} /> {s.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {activeTab==='qa' ? (
                <div style={{ padding: 14, display:'grid', gap:12 }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      value={query}
                      onChange={e=> setQuery(e.target.value)}
                      placeholder={chatMode==='chat' ? 'Pogovor z asistentom (slovenščina podprta)' : (loading? 'Nalaganje vsebine Annex 1…' : 'Vprašajte o Annex 1 (npr. klasifikacija čistih prostorov)')}
                      style={{ flex:1, padding:'10px 12px', background:'#0f172a', color:'#fff', border:'1px solid rgba(148,163,184,0.3)', borderRadius:8 }}
                    />
                    <button className="button" disabled={chatMode==='chat' && chatting} onClick={()=> chatMode==='chat' ? handleChatAsk() : setQuery(q=> q.trim())}>{chatMode==='chat' ? (chatting ? 'Pošiljam…' : 'Pošlji') : 'Išči'}</button>
                  </div>

                  {!query && chatMode!=='chat' && (
                    <div style={{ color:'#94a3b8' }}>Vnesite vprašanje. Primer: "Kaj je CCS in kako se dokumentira?"</div>
                  )}
                  {chatMode==='chat' && conversation.length===0 && (
                    <div style={{ color:'#94a3b8' }}>Začni pogovor: npr. "Pomagaj mi razumeti Grade A/B zahteve."</div>
                  )}

                  {chatMode==='chat' && conversation.length>0 && (
                    <div style={{ display:'grid', gap:10, maxHeight: fullScreen ? '76vh' : '46vh', overflow:'auto' }}>
                      {conversation.map((m, idx)=> (
                        <div key={idx} style={{
                          alignSelf: m.role==='user' ? 'end' : 'start',
                          background: m.role==='user' ? 'rgba(59,130,246,0.15)' : 'rgba(124,58,237,0.10)',
                          border: '1px solid rgba(148,163,184,0.25)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          maxWidth: '92%'
                        }}>
                          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{m.role==='user' ? 'Vi' : 'Asistent'}</div>
                          <div style={{ whiteSpace:'pre-wrap', lineHeight:1.55 }}>{m.content}</div>
                        </div>
                      ))}
                      {chatting && (
                        <div style={{ color:'#94a3b8', fontSize:12 }}>Asistent tipka…</div>
                      )}
                    </div>
                  )}

                  {chatMode!=='chat' && query && answer && (
                    <div style={{ display:'grid', gap:10, maxHeight: fullScreen ? '76vh' : '46vh', overflow:'auto' }}>
                      <div style={{ border:'1px solid rgba(124,58,237,0.35)', borderRadius:10, padding:12, background:'rgba(124,58,237,0.06)' }}>
                        <div style={{ whiteSpace:'pre-wrap', lineHeight:1.6 }}>{answer.text}</div>
                        {answer.citations.length>0 && (
                          <div style={{ marginTop:10, borderTop:'1px solid rgba(124,58,237,0.25)', paddingTop:8 }}>
                            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Viri in citati</div>
                            <div style={{ display:'grid', gap:6 }}>
                              {answer.citations.map((c, i)=> (
                                <div key={i} style={{ fontSize:13 }}>
                                  <span style={{ color:'#e2e8f0' }}>{c.title}</span>
                                  {c.section ? <span style={{ color:'#94a3b8' }}> • {c.section}</span> : null}
                                  {c.slug ? (
                                    <a href={`/lessons/${c.slug}`} style={{ marginLeft:8, color:'#7c3aed' }}>Odpri</a>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {chatMode === 'simple' && ranked.length>0 && (
                        <div>
                          <div style={{ fontSize:12, color:'#94a3b8', margin: '4px 0 8px' }}>Najdeni relevantni odstavki</div>
                          <div style={{ display:'grid', gap:8 }}>
                            {ranked.slice(0,6).map((r, idx)=> (
                              <div key={idx} style={{ border:'1px solid rgba(148,163,184,0.3)', borderRadius:8, padding:10, background:'rgba(148,163,184,0.06)' }}>
                                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{r.title} • {r.section}</div>
                                <div style={{ whiteSpace:'pre-wrap' }}>{r.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize:12, color:'#64748b' }}>
                    Namig: za natančnejše rezultate uporabite specifične izraze (npr. "Grade A/B aseptične operacije").
                  </div>
                </div>
              ) : activeTab==='news' ? (
                <div style={{ padding: 16, display:'grid', gap:14 }}>
                  {/* News category subtabs */}
                  <div style={{ display:'flex', gap:8, borderBottom:'1px solid rgba(124,58,237,0.25)', paddingBottom:8 }}>
                    <button
                      className={newsCategory==='annex1'? 'button active':'button'}
                      onClick={()=> { setNewsCategory('annex1'); markCategoryRead('annex1'); setUnreadByCategory({...unreadByCategory, annex1:0}) }}
                      style={{ fontSize:13 }}
                    >
                      Annex 1 {unreadByCategory.annex1>0 && `(${unreadByCategory.annex1})`}
                    </button>
                    <button
                      className={newsCategory==='fda'? 'button active':'button'}
                      onClick={()=> { setNewsCategory('fda'); markCategoryRead('fda'); setUnreadByCategory({...unreadByCategory, fda:0}) }}
                      style={{ fontSize:13 }}
                    >
                      FDA {unreadByCategory.fda>0 && `(${unreadByCategory.fda})`}
                    </button>
                    <button
                      className={newsCategory==='gxp'? 'button active':'button'}
                      onClick={()=> { setNewsCategory('gxp'); markCategoryRead('gxp'); setUnreadByCategory({...unreadByCategory, gxp:0}) }}
                      style={{ fontSize:13 }}
                    >
                      GxP {unreadByCategory.gxp>0 && `(${unreadByCategory.gxp})`}
                    </button>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>
                      {newsCategory==='annex1' ? 'Zadnjih 30 novic — EU GMP Annex 1' : newsCategory==='fda' ? 'Zadnjih 30 novic — FDA' : 'Zadnjih 30 novic — GxP'}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button
                        className="button"
                        onClick={async ()=> {
                          setRefreshing(true)
                          try {
                            await refreshFromRemote()
                            const a1 = getNewsByCategory('annex1').filter((i: NewsItem)=>!i.read).length
                            const fd = getNewsByCategory('fda').filter((i: NewsItem)=>!i.read).length
                            const gx = getNewsByCategory('gxp').filter((i: NewsItem)=>!i.read).length
                            setUnreadByCategory({ annex1: a1, fda: fd, gxp: gx })
                            setUnread(a1 + fd + gx)
                          } finally {
                            setRefreshing(false)
                          }
                        }}
                        style={{ fontSize:12, padding:'6px 12px' }}
                        disabled={refreshing}
                      >
                        {refreshing ? 'Osveževanje...' : '🔄 Osveži'}
                      </button>
                      <button
                        className="button"
                        onClick={()=> {
                          clearNewsCache()
                          // Force recompute counters
                          const a1 = getNewsByCategory('annex1').filter((i: NewsItem)=>!i.read).length
                          const fd = getNewsByCategory('fda').filter((i: NewsItem)=>!i.read).length
                          const gx = getNewsByCategory('gxp').filter((i: NewsItem)=>!i.read).length
                          setUnreadByCategory({ annex1: a1, fda: fd, gxp: gx })
                          setUnread(a1 + fd + gx)
                        }}
                        title="Počisti lokalni predpomnilnik novic"
                        style={{ fontSize:12, padding:'6px 12px', background:'rgba(148,163,184,0.15)', borderColor:'rgba(148,163,184,0.35)' }}
                      >
                        🗑 Počisti cache
                      </button>
                    </div>
                  </div>
                  <div style={{ display:'grid', gap:10, maxHeight: fullScreen ? '78vh' : '48vh', overflow:'auto' }}>
                    {newsByCat.length===0 ? (
                      <div style={{ color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>Ni novosti v tej kategoriji.</div>
                    ) : newsByCat.map((n: NewsItem)=> {
                      const isExpanded = expandedNews.has(n.id)
                      const toggleExpand = () => {
                        const newSet = new Set(expandedNews)
                        if (isExpanded) {
                          newSet.delete(n.id)
                        } else {
                          newSet.add(n.id)
                        }
                        setExpandedNews(newSet)
                      }
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity:0, x:-10 }}
                          animate={{ opacity:1, x:0 }}
                          style={{ 
                            border:'1px solid rgba(124,58,237,0.3)', 
                            borderRadius:10, 
                            padding:14, 
                            background:'rgba(124,58,237,0.06)', 
                            transition:'all 0.3s',
                            cursor: 'pointer'
                          }}
                          whileHover={{ background:'rgba(124,58,237,0.12)', borderColor:'rgba(124,58,237,0.5)' }}
                          onClick={toggleExpand}
                        >
                          <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:'#e2e8f0', flex:1 }}>{n.title}</div>
                            <div style={{ fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>{new Date(n.date).toLocaleDateString('sl-SI')}</div>
                          </div>
                          <div style={{ 
                            whiteSpace:'pre-wrap', 
                            marginTop:6, 
                            color:'#cbd5e1', 
                            fontSize:13, 
                            lineHeight:1.6,
                            maxHeight: isExpanded ? 'none' : '60px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            {n.summary}
                          </div>
                          {!isExpanded && n.summary.length > 150 && (
                            <div style={{ 
                              marginTop: 6, 
                              color: '#a78bfa', 
                              fontSize: 12, 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              Klikni za več ▼
                            </div>
                          )}
                          {isExpanded && (
                            <div style={{ 
                              marginTop: 8, 
                              color: '#a78bfa', 
                              fontSize: 12, 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              Klikni za skrči ▲
                            </div>
                          )}
                          {n.link && (
                            <a 
                              href={n.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color:'#7c3aed', fontSize:12, marginTop:8, display:'inline-block', fontWeight:600 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Odpri celoten članek →
                            </a>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <ToolsPanel toolTab={toolTab} setToolTab={setToolTab} fullScreen={fullScreen} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .button {
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.4);
          color: #e9d5ff;
          padding: 9px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.25s ease;
        }
        .button:hover { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.6); transform: translateY(-1px); }
        .button.active { background: rgba(124,58,237,0.3); border-color: rgba(124,58,237,0.7); box-shadow: 0 0 12px rgba(124,58,237,0.4); }
      `}</style>
    </>
  )
}
