import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: 'sl' as const, label: 'SLO', flag: '🇸🇮' },
    { code: 'en' as const, label: 'ENG', flag: '🇬🇧' },
    { code: 'hr' as const, label: 'HRV', flag: '🇭🇷' }
  ]

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '6px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {languages.map(lang => (
        <motion.button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: language === lang.code 
              ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
              : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
            fontWeight: language === lang.code ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: language === lang.code 
              ? '0 4px 15px rgba(124, 58, 237, 0.4)' 
              : 'none'
          }}
        >
          <span style={{ fontSize: '18px' }}>{lang.flag}</span>
          <span style={{ letterSpacing: '0.5px' }}>{lang.label}</span>
          
          {language === lang.code && (
            <motion.div
              layoutId="activeLanguage"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.3))',
                borderRadius: '12px',
                zIndex: -1
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  )
}
