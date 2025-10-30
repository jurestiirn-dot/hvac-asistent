# 🎨 Predlogi za Vizualne in Pregledne Funkcije

## ✅ IMPLEMENTIRANO

### 1. **Večjezična Podpora** 🌍
- **Jeziki**: Slovenščina, Angleščina, Hrvaščina
- **Selektor**: Animiran gumb v header-ju z zastavicami (🇸🇮 🇬🇧 🇭🇷)
- **Shranjevanje**: Izbira shranjena v localStorage
- **Prevedeni elementi**:
  - Navigacija (Lekcije, Profil, Odjava)
  - Kategorije (Validacija, Higiena, HEPA, Monitoring)
  - Kviz (vprašanja, namigi, rezultati)
  - Gumbi in sporočila
  - Auth strani (prijava, registracija)

---

## 🚀 PRIPOROČILA ZA NADALJNJE IZBOLJŠAVE

### 2. **Dashboard Analytics** 📊
**Kaj dodati:**
- **Progress Tracker**: Vizualni prikaz napredka po kategorijah
  - Circular progress bars za vsako kategorijo
  - Procent dokončanih lekcij
  - Earned badges/achievements
  
- **Recent Activity Timeline**:
  - Zadnje opravljene lekcije
  - Kviz rezultati (graf trend linije)
  - Time spent learning (daily/weekly stats)

- **Leaderboard**:
  - Top učenci (če multi-user)
  - Comparisons s povprečjem
  - Weekly challenges

**Tehnologija**: Chart.js (že vključeno), Framer Motion za animacije

---

### 3. **Enhanced Quiz Experience** 🎯
**Izboljšave:**
- **Timer mode**: Opcija za časovno omejitev (npr. 2 min/vprašanje)
- **Confidence slider**: Uporabnik označi kako prepričan je v odgovor (1-5)
- **Streak tracker**: Število zaporednih pravilnih odgovorov
- **Power-ups**:
  - ❌ 50:50 (eliminiraj 2 napačna odgovora)
  - 🔄 Skip question (enkrat na kviz)
  - ⏱️ Extra time (+30 sec)
  
- **Review mode**: Po kvizu pregled vseh vprašanj z razlagami
- **Bookmark questions**: Shrani težka vprašanja za kasneje

---

### 4. **Interactive 3D Visualizations** 🎭
**Uporabi Three.js za:**
- **Cleanroom 3D Model**: 
  - Navigacija po prostoru z miško
  - Clickable hotspots (HEPA filtri, air locks, UV lights)
  - Particle flow simulation (real-time)
  
- **Equipment 3D Models**:
  - Autoclave cross-section
  - Isolator internals
  - HVAC system diagram (interactive layers)

- **Molecular Animations**:
  - H₂O₂ gas penetration
  - Contaminant spread simulation
  - Filter efficiency demo

**Tehnologija**: Three.js (že vključeno), React Three Fiber

---

### 5. **Dark/Light Mode Toggle** 🌓
**Features:**
- Smooth transition animation
- System preference detection
- Per-page override option
- Custom color themes:
  - 🌙 Dark (trenutno)
  - ☀️ Light
  - 🌅 High Contrast
  - 🎨 Custom (user-defined colors)

---

### 6. **Smart Search & Filters** 🔍
**Funkcionalnosti:**
- **Global search**: Iskanje po vsebini lekcij, ne samo naslovih
- **Advanced filters**:
  - Difficulty level (Beginner, Intermediate, Advanced)
  - Duration (< 10 min, 10-20 min, > 20 min)
  - Has quiz / No quiz
  - Completed / In progress / Not started
  
- **Search suggestions**: Auto-complete z highlight
- **Search history**: Zadnja iskanja
- **Tag system**: #validation #hepa #personnel itd.

---

### 7. **Lesson Roadmap / Learning Path** 🗺️
**Vizualizacija:**
- **Interactive flowchart**: Katera lekcija vodi do katere
- **Prerequisites**: Rdeča črta če nisi dokončal predpogoja
- **Recommended path**: AI/rule-based predlogi
- **Milestone badges**: 
  - 🥉 5 lekcij
  - 🥈 10 lekcij
  - 🥇 Vse lekcije + vsi kvizi 80%+

**UI**: SVG flowchart z zoom/pan, podobno kot mind map

---

### 8. **Collaborative Features** 👥
**Social learning:**
- **Discussion threads**: Komentar sekcija pod vsako lekcijo
- **Q&A section**: Uporabniki lahko vprašajo, drugi odgovorijo
- **User notes**: Deli beležke z drugimi (opt-in)
- **Study groups**: Ustvari skupine za skupno učenje
- **Live sessions**: Scheduled webinars / video calls

---

### 9. **Gamification** 🎮
**Elementi:**
- **XP System**: Earn experience points
  - Dokončana lekcija: +10 XP
  - Kviz 100%: +50 XP
  - First try perfect: +20 bonus XP
  
- **Levels**: 
  - 0-100 XP: Novice
  - 100-300: Apprentice
  - 300-600: Practitioner
  - 600-1000: Expert
  - 1000+: Master

- **Achievements/Trophies**:
  - 🏆 "Perfect Score" - 100% na 5 kvizih
  - 🔥 "On Fire" - 7 dni zapored učenja
  - 📚 "Bookworm" - Preberi vse razlage
  - ⚡ "Speed Demon" - Kviz v <2 min
  - 💡 "Hint Free" - Kviz brez namigov

- **Daily/Weekly challenges**: Bonus XP za posebne naloge

---

### 10. **Offline Mode** 📴
**PWA Features:**
- **Service Worker**: Cache lekcij za offline dostop
- **Download lessons**: Shrani izbrane lekcije lokalno
- **Sync on reconnect**: Auto-upload kviz rezultatov
- **Notification**: "You're offline - 12 lessons available"

**Instalacija**: "Add to Home Screen" popup

---

### 11. **Accessibility Improvements** ♿
**A11y Features:**
- **Screen reader support**: ARIA labels za vse interactive elemente
- **Keyboard navigation**: Tab order optimization
- **High contrast mode**: WCAG AAA compliance
- **Font size control**: 3 sizes (S, M, L)
- **Dyslexia-friendly font**: OpenDyslexic option
- **Text-to-speech**: Read aloud lekcije in vprašanja
- **Closed captions**: Za vse video vsebine

---

### 12. **Mobile Optimization** 📱
**Responsive enhancements:**
- **Touch gestures**: Swipe left/right med vprašanji
- **Bottom navigation**: Easier thumb reach
- **Collapsible sections**: Accordion za dolge lekcije
- **Fullscreen mode**: Hide browser UI za immersive experience
- **Haptic feedback**: Vibration ob pravilnem odgovoru

---

### 13. **Admin Dashboard** 🛠️
**Za učitelje/admins:**
- **Create/Edit lessons**: WYSIWYG editor
- **Upload visualizations**: Drag & drop media
- **Quiz builder**: Visual interface za ustvarjanje vprašanj
- **Analytics**:
  - Katera vprašanja so najtežja? (fail rate)
  - Katera lekcija ima najdaljši čas učenja?
  - User engagement metrics
  
- **Bulk import**: CSV upload za vprašanja
- **Version control**: Draft/Published status

---

### 14. **Export & Print** 🖨️
**Funkcionalnosti:**
- **PDF export**: Lekcija + vizualizacije → PDF
- **Print-friendly view**: Optimiziran layout
- **Study guide generator**: Auto-summary vseh lekcij
- **Flashcards export**: Anki/Quizlet format
- **Certificate generator**: Po dokončanju vseh lekcij

---

### 15. **AI Assistant / Chatbot** 🤖
**Integracija AI:**
- **Ask questions**: "Explain HEPA filters in simple terms"
- **Quiz help**: "Give me a hint" (smart hints, ne generic)
- **Personalized recommendations**: Suggest next lesson based na performance
- **Spaced repetition**: AI schedules review sessions
- **Conversational learning**: Chat interface namesto klasične lekcije

**API**: OpenAI GPT-4, Anthropic Claude

---

## 🎨 VISUAL DESIGN PATTERNS

### Color System Enhancement
```css
/* Current */
--primary: #7c3aed (purple)
--secondary: #06b6d4 (cyan)
--success: #10b981 (green)
--warning: #fbbf24 (yellow)
--danger: #ef4444 (red)

/* Add gradients */
--gradient-primary: linear-gradient(135deg, #7c3aed, #a78bfa)
--gradient-success: linear-gradient(135deg, #10b981, #34d399)
--gradient-danger: linear-gradient(135deg, #ef4444, #f87171)

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05)
--glass-border: rgba(255, 255, 255, 0.1)
backdrop-filter: blur(10px)
```

### Micro-interactions
- **Button hover**: Scale 1.05 + shadow glow
- **Card hover**: Lift effect (translateY(-4px))
- **Input focus**: Border glow animation
- **Success feedback**: Checkmark animation + confetti
- **Error shake**: Horizontal vibration
- **Loading states**: Skeleton screens (ne spinners)

### Typography Scale
```css
--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 30px
--text-4xl: 36px

/* Font weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-black: 900
```

---

## 📊 PRIORITIZACIJA

### 🔥 High Priority (Implementiraj najprej)
1. ✅ Večjezična podpora (DONE)
2. Dashboard Analytics
3. Enhanced Quiz (timer, review mode)
4. Smart Search & Filters
5. Mobile optimization

### ⭐ Medium Priority
6. Dark/Light mode toggle
7. Gamification (XP, badges)
8. Lesson Roadmap
9. Offline mode (PWA)
10. Accessibility improvements

### 💡 Nice to Have
11. 3D Visualizations (Three.js)
12. AI Assistant
13. Collaborative features
14. Admin dashboard
15. Export & Print

---

## 🛠️ TEHNOLOGIJA STACK PREGLED

**Že uporabljeno:**
- React 18
- TypeScript
- React Router
- Framer Motion ✅
- Chart.js ✅
- Three.js ✅ (za nadaljne 3D)
- Lottie ✅
- Canvas Confetti ✅

**Priporočam dodati:**
- **React Query**: Za API calls & caching
- **Zustand / Jotai**: Lightweight state management
- **React Hook Form**: Form handling
- **Zod**: Runtime validation
- **Radix UI**: Unstyled accessible components
- **date-fns**: Date manipulation
- **Recharts**: Alternative Chart.js (React native)
- **React Beautiful DnD**: Drag & drop functionality
