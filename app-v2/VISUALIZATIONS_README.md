# HVAC Asistent - Interaktivne Vizualizacije 🎯

## Pregled Sistema

HVAC Asistent je napredna učna platforma za GMP Annex 1 aseptično proizvodnjo z interaktivnimi 3D vizualizacijami, večjezično podporo (slovenščina, angleščina, hrvaščina) in kompleksnimi simulacijami.

---

## ✨ Nove Funkcionalnosti

### 1. **Profesionalen Header**
- 🎨 HVAC ikona z animiranim ventilatorjem (rotacija + airflow efekt)
- 💫 Gradient ozadje z backdrop blur
- 🔘 Interaktivni gumbi z hover efekti
- 🌍 Večjezični selektor
- 👤 User profil dropdown

### 2. **HVAC Tematska Animacija**
Zamenjana generična "torus knot" animacija z:
- 💨 **Airflow particles** - 800 delcev ki simulirajo pretok zraka
- 🔲 **HEPA filter vizualizacija** - Wireframe grid
- 🌊 **Wave pattern** - Realistični valoviti pretok
- 💫 **Breathing efekt** - Filter "diha" (opacity spremembe)
- 📹 **Gentle camera movement** - Dodana globina

### 3. **Večjezična Podpora**
- ✅ **Slovenščina** (SL) - Originalna vsebina
- ✅ **Angleščina** (EN) - Google Translate (31 lekcij)
- ✅ **Hrvaščina** (HR) - Google Translate (31 lekcij)
- 🔄 Dinamično preklapljanje med jeziki
- 📦 Fallback mehanizem (če prevod manjka, prikaže slovenščino)

---

## 🎮 Interaktivne 3D Vizualizacije

### **AdvancedAirflowVisualization** (Three.js)
**Lekcije:** Osnove Annex 1, Vizualizacija pretoka zraka

**Funkcije:**
- 🏢 3D cleanroom model s stropnimi HEPA filtri
- 💨 2000 animiranih zračnih delcev
- 👤 Operator figure (telo + glava)
- 🛠️ Equipment (workstation table)
- 🔴 Pressure indicators (4x rotating + pulsing)
- 🌀 Return air grilles

**Kontrolerji:**
- **Room Class** (A/B/C/D) - Spremeni barvo indikatorjev
- **Filter Type** (HEPA/ULPA) - Informativno
- **Air Velocity** (0.36-0.54 m/s) - Slider za hitrost delcev
- **Show Particles** (checkbox) - Vklop/izklop delcev

**Učni koncepti:**
- Unidirectional flow (laminar airflow)
- HEPA filtration (99.995% @ ≥0.3 μm)
- Particle removal mechanism
- Pressure cascade system

---

### **MediaFillSimulation** (Three.js)
**Lekcija:** Media Fill Test - Simulacija Aseptičnega Procesa

**Funkcije:**
- 🏭 Conveyor belt system
- 💉 Filling nozzle (animiran)
- 🧪 12 vials (clean = roza, contaminated = rumena)
- 🛡️ Laminar flow hood (transparent glass barrier)
- 🔬 HEPA filter grid above
- 💫 500 airflow particles

**Simulacija:**
- ⏱️ **4 faze** (setup → filling → incubation → inspection)
- 📊 Real-time progress bar (0-100%)
- 🦠 Contamination tracking (0.1% acceptance criteria)
- ✅ Pass/Fail indicator
- 🔢 Nastavitev total units (default: 3000)

**Kontrolerji:**
- ▶️ **Start/Stop** button
- 🔄 **Reset** button
- 📈 **Progress display**
- 🦠 **Contamination counter**
- 📉 **Failure rate** calculation

**GMP Requirements:**
- Max 0.1% contamination (1 in 1000 units)
- 3 successful runs for initial validation
- Semi-annual requalification
- Minimum 3,000-5,000 units

---

### **ParticleVisualization** (Canvas 2D)
**Lekcija:** Razvrščanje Čistih Prostorov

**Funkcije:**
- 📊 3D bar chart za razrede A/B/C/D
- ✨ Glow effects na stolpcih
- 🎨 Color-coded bars (zelena, vijolična, oranžna, rdeča)
- 💫 Smooth animations

**Kontrolerji:**
- 🔘 Toggle: **≥0.5 μm** particles
- 🔘 Toggle: **≥5.0 μm** particles

**Data:**
```
Razred A: 20 (0.5μm), 0 (5.0μm)
Razred B: 3,520 (0.5μm), 29 (5.0μm)
Razred C: 352,000 (0.5μm), 2,900 (5.0μm)
Razred D: 3,520,000 (0.5μm), 29,000 (5.0μm)
```

**ISO Klasifikacija:**
- Grade A = ISO 5
- Grade B = ISO 5-7
- Grade C = ISO 7-8
- Grade D = ISO 8

---

## 📁 Struktura Datotek

```
src/
├── components/
│   ├── LessonVisualizations.tsx (2800+ vrstic)
│   │   ├── AdvancedAirflowVisualization (3D Three.js)
│   │   ├── HepaEfficiencyChart
│   │   ├── MicrobeGrowth
│   │   ├── PressureGauge
│   │   ├── SterilizationTimeline
│   │   ├── ValidationPhases
│   │   ├── TraceabilityFlow
│   │   ├── PersonnelBehavior
│   │   ├── IsolatorCrossSection
│   │   ├── RiskMatrix
│   │   ├── DocumentFlow
│   │   ├── DisinfectionCycle
│   │   ├── UtilityMonitoring
│   │   ├── MaintenanceSchedule
│   │   ├── EnvironmentalTrend
│   │   ├── IncidentTimeline
│   │   └── LessonVisualization (router)
│   │
│   ├── AdvancedVisualizations.tsx (NOVO - 700+ vrstic)
│   │   ├── MediaFillSimulation (3D Three.js)
│   │   └── ParticleVisualization (Canvas 2D)
│   │
│   ├── ThreeAccent.tsx (posodobljeno)
│   │   └── HVAC airflow background animacija
│   │
│   └── ... (ostale komponente)
│
├── content/
│   ├── annex1-sl.json (1,611 vrstic - 21 lekcij)
│   ├── annex1-en.json (angleščina)
│   ├── annex1-hr.json (hrvaščina)
│   ├── annex1-advanced-sl.json (10 naprednih lekcij)
│   ├── annex1-advanced-en.json
│   ├── annex1-advanced-hr.json
│   ├── translate_lessons.py (Google Translate script)
│   ├── translate_with_openai.py (OpenAI GPT-4o-mini script)
│   └── TRANSLATION_README.md
│
└── App.tsx (posodobljen header)
```

---

## 🚀 Zagon Aplikacije

### Predpogoji
```bash
# Node.js in npm morata biti nameščena
# Python 3.11+ za prevajalne skripte (opcijsko)
```

### Instalacija Odvisnosti
```bash
cd "C:\Users\Jure\Desktop\Končne verzije\v0,1\hvac asistent\app-v2"
npm install
```

### Razvoj (Development Mode)
```bash
npm run dev
```
Aplikacija teče na: http://localhost:5173

### Produkcija (Build)
```bash
npm run build
npm run preview
```

---

## 🎯 Uporaba Vizualizacij

### V Lekcijah
1. Odpri katero koli lekcijo
2. Na vrhu strani se prikaže **"🎨 Interaktivna Vizualizacija"** sekcija
3. Interakcija:
   - **Media Fill Test**: Klikni "▶️ Start Media Fill Test"
   - **Airflow**: Nastavi parametre (Room Class, Filter, Velocity)
   - **Particles**: Toggle med 0.5μm in 5.0μm
   - **Vse druge**: Avtomatsko animirane ali s play/pause gumbi

### V Kvizu
1. Scroll na dno lekcije
2. Klikni "🎯 Začni Kviz"
3. Odgovarjaj na vprašanja
4. Preveri rezultate

---

## 🌍 Večjezičnost

### Preklapljanje Jezikov
1. Klikni na jezik selektor v headerju (SL | GB ENG | HR HRV)
2. Lekcije se samodejno ponovno naložijo v izbranem jeziku
3. Če prevod ne obstaja, se prikaže slovenska verzija

### Dodajanje Novih Prevodov

#### Opcija 1: Google Translate (Brezplačno)
```bash
cd src/content
python translate_lessons.py
```
- Avtomatsko prevede vse datoteke
- Kakovost: Dobra za splošno vsebino
- Čas: ~30-45 minut za vse lekcije

#### Opcija 2: OpenAI GPT-4o-mini (Plačljivo - $0.30-0.60)
```bash
# Nastavi API ključ
$env:OPENAI_API_KEY="sk-proj-your-key-here"

# Zaženi skript
python translate_with_openai.py
```
- Izberi opcijo iz menija (1-7)
- Kakovost: Odlična za farmacevtsko terminologijo
- Čas: ~30-45 minut za vse lekcije
- Strošek: ~$0.01-0.02 per lekcija

---

## 🧪 Testiranje

### Preveri Večjezičnost
1. Zaženi aplikacijo
2. Izberi angleščino
3. Odpri lekcijo "Osnove Annex 1"
4. Preveri, da je vsebina v angleščini
5. Ponovi za hrvaščino

### Preveri Vizualizacije
1. Lekcija 101: Advanced Airflow (3D)
2. Lekcija 112: Media Fill Simulation (3D)
3. Lekcija 103: Particle Visualization (2D)
4. Testiraj vse kontrolerje in gumbe

### Preveri Header
1. Animacija ventilatorja teče
2. Hover efekti na gumbih delujejo
3. Language selector deluje
4. User menu dropdown deluje

---

## 🐛 Znane Težave

### Three.js Type Errors
- **Problem**: TypeScript prikazuje type napake za Three.js komponente
- **Vzrok**: Različica @types/three ni popolnoma kompatibilna
- **Rešitev**: Ignoriraj - aplikacija deluje normalno v runtime
- **Fix (opcijsko)**: `npm install --save-dev @types/three@latest`

### npm Not in PATH
- **Problem**: Terminalni ukazi npm ne delujejo
- **Vzrok**: Node.js ni dodan v system PATH
- **Rešitev**: Uporabi full path ali dodaj v PATH

---

## 📚 Dodatni Viri

### Dokumentacija
- **GMP Annex 1**: EU Guidelines to Good Manufacturing Practice (2022 revision)
- **ISO 14644**: Cleanrooms and controlled environments
- **Three.js Docs**: https://threejs.org/docs/
- **React**: https://react.dev/

### Interne Reference
- `TRANSLATION_README.md` - Detajlna navodila za prevajanje
- `src/services/cms.ts` - Content management system
- `src/contexts/LanguageContext.tsx` - Večjezični kontekst

---

## 👥 Kontakt

Za vprašanja, težave ali predloge kontaktirajte razvijalca.

---

## 📝 Changelog

### v0.2 (Januar 2025)
- ✅ Dodane 3 nove interaktivne 3D vizualizacije
- ✅ Večjezična podpora (SL/EN/HR)
- ✅ Profesionalen HVAC header
- ✅ HVAC tematska background animacija
- ✅ 62 prevodov (31 lekcij x 2 jezika)
- ✅ Export vseh visualization komponent

### v0.1 (December 2024)
- ✅ Osnovni sistem lekcij
- ✅ Kviz funkcionalnost
- ✅ Registracija/prijava
- ✅ Osnovne vizualizacije

---

**Ustvarjeno z ❤️ za HVAC strokovno skupnost**
