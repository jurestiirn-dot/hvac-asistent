import React from 'react'
import { Link } from 'react-router-dom'
import cms, { Lesson } from '../services/cms'
import { useToast } from '../components/Toast'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../context/AuthContext'

const lessonIcons: Record<number, string> = {
  101: '🏥', // Osnove - Hospital
  102: '💨', // HEPA - Air
  103: '🔬', // Razvrščanje - Microscope
  104: '⚡', // Tlačne razlike - Lightning
  105: '🌀', // Izmenjava zraka - Cyclone
  106: '🦠', // Mikrobiološko - Microbe
  107: '🧼', // Čiščenje - Soap
  108: '🧑‍⚕️', // Osebje - Healthcare worker
  109: '✅', // Validacija - Checkmark
  110: '📦', // Materiali - Package
  111: '💨', // Vizualizacija pretoka - Air visualization
  112: '🧪', // Media Fill - Test tube
  113: '👤', // Osebje aseptika - Person
  115: '⚠️', // CCP Risk - Warning
  116: '📝', // Dokumentacija - Document
  117: '🧽', // Dezinfekcija - Sponge
  118: '💧', // Utilities - Water
  119: '🔧', // Vzdrževanje - Wrench
  120: '📊', // Monitoring - Chart
  121: '🔄', // CAPA - Cycle
  122: '🌡️', // Temperatura/Vlažnost - Thermometer
  123: '🔬', // Delci - Microscope
  124: '🦠', // Mikrobiologija - Microbe
  125: '♨️', // Sterilizacija - Hot springs/steam
  126: '🏗️', // Načrtovanje - Construction
  127: '🧱', // Materiali - Brick
  128: '✅', // Kvalifikacija - Checkmark
  129: '💨', // HVAC - Air system
  130: '⚡', // Električne instalacije - Lightning
  131: '💧' // Vodovod - Water
}

// Theme categories
const lessonCategories: Record<number, { name: string; color: string }> = {
  101: { name: 'Osnove', color: '#7c3aed' },
  102: { name: 'HEPA Sistemi', color: '#06b6d4' },
  103: { name: 'Osnove', color: '#7c3aed' },
  104: { name: 'HEPA Sistemi', color: '#06b6d4' },
  105: { name: 'HEPA Sistemi', color: '#06b6d4' },
  106: { name: 'Higiena', color: '#10b981' },
  107: { name: 'Higiena', color: '#10b981' },
  108: { name: 'Higiena', color: '#10b981' },
  109: { name: 'Validacija', color: '#f59e0b' },
  110: { name: 'Validacija', color: '#f59e0b' },
  111: { name: 'HEPA Sistemi', color: '#06b6d4' },
  112: { name: 'Validacija', color: '#f59e0b' },
  113: { name: 'Higiena', color: '#10b981' },
  115: { name: 'Validacija', color: '#f59e0b' },
  116: { name: 'Validacija', color: '#f59e0b' },
  117: { name: 'Higiena', color: '#10b981' },
  118: { name: 'HEPA Sistemi', color: '#06b6d4' },
  119: { name: 'Validacija', color: '#f59e0b' },
  120: { name: 'Higiena', color: '#10b981' },
  121: { name: 'Validacija', color: '#f59e0b' },
  122: { name: 'Osnove', color: '#7c3aed' },
  123: { name: 'Osnove', color: '#7c3aed' },
  124: { name: 'Osnove', color: '#7c3aed' },
  125: { name: 'Osnove', color: '#7c3aed' },
  126: { name: 'Izgradnja', color: '#ef4444' },
  127: { name: 'Izgradnja', color: '#ef4444' },
  128: { name: 'Izgradnja', color: '#ef4444' },
  129: { name: 'Izgradnja', color: '#ef4444' },
  130: { name: 'Izgradnja', color: '#ef4444' },
  131: { name: 'Izgradnja', color: '#ef4444' }
}

export default function LessonsList() {
  const [lessons, setLessons] = React.useState<Lesson[]>([])
  const [filter, setFilter] = React.useState<string>('all')
  const { showToast } = useToast()
  const { language } = useLanguage()
  const { isLessonUnlocked } = useAuth()

  React.useEffect(() => {
    cms.fetchLessons(language)
      .then(setLessons)
      .catch(err => {
        console.error('Failed to fetch lessons:', err)
        showToast('Ni bilo mogoče naložiti lekcij. Preverite internetno povezavo.', 'error')
      })
  }, [showToast, language])

  const filteredLessons = filter === 'all' 
    ? lessons 
    : lessons.filter(l => lessonCategories[l.id]?.name === filter)

  const categories = ['all', 'Osnove', 'HEPA Sistemi', 'Higiena', 'Validacija', 'Izgradnja']

  return (
    <div className="lessons-container">
      <div className="lessons-header">
        <h2>📚 Razpoložljive Lekcije</h2>
        <p className="lessons-subtitle">Izberite lekcijo za začetek učenja</p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
          >
            {cat === 'all' ? '🔍 Vse' : cat}
          </button>
        ))}
      </div>
      
      <div className="lessons-grid">
        {filteredLessons.map((l, index) => {
          const category = lessonCategories[l.id]
          const isUnlocked = isLessonUnlocked(l.id)
          
          return (
            <Link 
              to={isUnlocked ? `/lessons/${l.slug}` : '#'} 
              key={l.slug} 
              className={`lesson-card ${!isUnlocked ? 'locked' : ''}`}
              style={{
                '--card-index': index,
                '--category-color': category?.color || '#7c3aed',
                opacity: isUnlocked ? 1 : 0.5,
                cursor: isUnlocked ? 'pointer' : 'not-allowed'
              } as React.CSSProperties}
              onClick={(e) => {
                if (!isUnlocked) {
                  e.preventDefault()
                  showToast('🔒 Ta lekcija je zaklenjena. Kontaktirajte administratorja.', 'error')
                }
              }}
            >
              <div className="lesson-card-inner">
                <div className="lesson-category-badge">{category?.name || 'Osnove'}</div>
                <div className="lesson-icon">
                  {!isUnlocked && <span style={{position: 'absolute', fontSize: '2em', top: '-10px', right: '-10px'}}>🔒</span>}
                  {lessonIcons[l.id] || '📖'}
                </div>
                <div className="lesson-number">{index + 1}</div>
                <h3 className="lesson-card-title">{l.title}</h3>
                <p className="lesson-card-reference">{l.annexReference}</p>
                <div className="lesson-card-arrow">{isUnlocked ? '→' : '🔒'}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
