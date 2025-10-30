import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'sl' | 'en' | 'hr'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  sl: {
    // Navigation
    'nav.lessons': 'Lekcije',
    'nav.profile': 'Profil',
    'nav.logout': 'Odjava',
    
    // Home/Dashboard
    'home.welcome': 'Dobrodošli v',
    'home.subtitle': 'Učni asistent z vizualizacijami',
    'home.allLessons': 'Vse Lekcije',
    'home.filterByCategory': 'Filtriraj po kategoriji',
    'home.allCategories': 'Vse kategorije',
    
    // Lesson Page
    'lesson.visualization': 'Interaktivna Vizualizacija',
    'lesson.explanation': 'Razlaga in Razvoj Konceptov',
    'lesson.challenges': 'Praktični Izzivi',
    'lesson.improvements': 'Ideje za Izboljšave',
    'lesson.quiz': 'Kviz - Preveri Znanje',
    'lesson.startQuiz': 'Začni Kviz',
    'lesson.testYourKnowledge': 'Preizkusite svoje znanje z',
    'lesson.questions': 'vprašanji',
    
    // Quiz
    'quiz.answered': 'Odgovorjeno',
    'quiz.hints': 'Namigi',
    'quiz.hint': 'Namig',
    'quiz.hideHint': 'Skrij',
    'quiz.showHint': 'Prikaži namig',
    'quiz.maxHints': 'Maksimalno 3 namigi na kviz',
    'quiz.submit': 'Oddaj Kviz',
    'quiz.previous': 'Prejšnje',
    'quiz.next': 'Naslednje',
    'quiz.results': 'Rezultati',
    'quiz.score': 'Vaš rezultat',
    'quiz.passed': 'Čestitke! Uspešno ste opravili kviz.',
    'quiz.failed': 'Žal niste dosegli potrebnega minimuma (55%).',
    'quiz.tryAgain': 'Poskusi Znova',
    'quiz.passRequired': 'Za uspeh potrebujete 55%+',
    
    // Auth
    'auth.login': 'Prijava',
    'auth.register': 'Registracija',
    'auth.username': 'Uporabniško ime',
    'auth.password': 'Geslo',
    'auth.confirmPassword': 'Potrdi geslo',
    'auth.signIn': 'Prijavi se',
    'auth.signUp': 'Registriraj se',
    'auth.noAccount': 'Nimate računa?',
    'auth.haveAccount': 'Že imate račun?',
    
    // Categories
    'category.validation': 'Validacija',
    'category.hygiene': 'Higiena',
    'category.hepa': 'HEPA Sistemi',
    'category.monitoring': 'Monitoring',
    
    // Common
    'common.loading': 'Nalaganje...',
    'common.close': 'Zapri',
    'common.save': 'Shrani',
    'common.cancel': 'Prekliči',
    'common.delete': 'Izbriši',
    'common.edit': 'Uredi',
    'common.view': 'Poglej',
    'common.back': 'Nazaj'
  },
  
  en: {
    // Navigation
    'nav.lessons': 'Lessons',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // Home/Dashboard
    'home.welcome': 'Welcome to',
    'home.subtitle': 'Learning assistant with visualizations',
    'home.allLessons': 'All Lessons',
    'home.filterByCategory': 'Filter by category',
    'home.allCategories': 'All categories',
    
    // Lesson Page
    'lesson.visualization': 'Interactive Visualization',
    'lesson.explanation': 'Explanation and Concept Development',
    'lesson.challenges': 'Practical Challenges',
    'lesson.improvements': 'Improvement Ideas',
    'lesson.quiz': 'Quiz - Test Your Knowledge',
    'lesson.startQuiz': 'Start Quiz',
    'lesson.testYourKnowledge': 'Test your knowledge with',
    'lesson.questions': 'questions',
    
    // Quiz
    'quiz.answered': 'Answered',
    'quiz.hints': 'Hints',
    'quiz.hint': 'Hint',
    'quiz.hideHint': 'Hide',
    'quiz.showHint': 'Show hint',
    'quiz.maxHints': 'Maximum 3 hints per quiz',
    'quiz.submit': 'Submit Quiz',
    'quiz.previous': 'Previous',
    'quiz.next': 'Next',
    'quiz.results': 'Results',
    'quiz.score': 'Your score',
    'quiz.passed': 'Congratulations! You passed the quiz.',
    'quiz.failed': 'Unfortunately, you did not reach the minimum (55%).',
    'quiz.tryAgain': 'Try Again',
    'quiz.passRequired': 'You need 55%+ to pass',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm password',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    
    // Categories
    'category.validation': 'Validation',
    'category.hygiene': 'Hygiene',
    'category.hepa': 'HEPA Systems',
    'category.monitoring': 'Monitoring',
    
    // Common
    'common.loading': 'Loading...',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.back': 'Back'
  },
  
  hr: {
    // Navigation
    'nav.lessons': 'Lekcije',
    'nav.profile': 'Profil',
    'nav.logout': 'Odjava',
    
    // Home/Dashboard
    'home.welcome': 'Dobrodošli u',
    'home.subtitle': 'Učni asistent s vizualizacijama',
    'home.allLessons': 'Sve Lekcije',
    'home.filterByCategory': 'Filtriraj po kategoriji',
    'home.allCategories': 'Sve kategorije',
    
    // Lesson Page
    'lesson.visualization': 'Interaktivna Vizualizacija',
    'lesson.explanation': 'Objašnjenje i Razvoj Koncepata',
    'lesson.challenges': 'Praktični Izazovi',
    'lesson.improvements': 'Ideje za Poboljšanja',
    'lesson.quiz': 'Kviz - Provjeri Znanje',
    'lesson.startQuiz': 'Započni Kviz',
    'lesson.testYourKnowledge': 'Provjerite svoje znanje s',
    'lesson.questions': 'pitanja',
    
    // Quiz
    'quiz.answered': 'Odgovoreno',
    'quiz.hints': 'Savjeti',
    'quiz.hint': 'Savjet',
    'quiz.hideHint': 'Sakrij',
    'quiz.showHint': 'Prikaži savjet',
    'quiz.maxHints': 'Maksimalno 3 savjeta po kvizu',
    'quiz.submit': 'Predaj Kviz',
    'quiz.previous': 'Prethodno',
    'quiz.next': 'Sljedeće',
    'quiz.results': 'Rezultati',
    'quiz.score': 'Vaš rezultat',
    'quiz.passed': 'Čestitamo! Uspješno ste položili kviz.',
    'quiz.failed': 'Nažalost, niste postigli potrebni minimum (55%).',
    'quiz.tryAgain': 'Pokušaj Ponovo',
    'quiz.passRequired': 'Za uspjeh trebate 55%+',
    
    // Auth
    'auth.login': 'Prijava',
    'auth.register': 'Registracija',
    'auth.username': 'Korisničko ime',
    'auth.password': 'Lozinka',
    'auth.confirmPassword': 'Potvrdi lozinku',
    'auth.signIn': 'Prijavi se',
    'auth.signUp': 'Registriraj se',
    'auth.noAccount': 'Nemate račun?',
    'auth.haveAccount': 'Već imate račun?',
    
    // Categories
    'category.validation': 'Validacija',
    'category.hygiene': 'Higijena',
    'category.hepa': 'HEPA Sustavi',
    'category.monitoring': 'Monitoring',
    
    // Common
    'common.loading': 'Učitavanje...',
    'common.close': 'Zatvori',
    'common.save': 'Spremi',
    'common.cancel': 'Odustani',
    'common.delete': 'Izbriši',
    'common.edit': 'Uredi',
    'common.view': 'Pogledaj',
    'common.back': 'Natrag'
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    return (saved as Language) || 'sl'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['sl']] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
