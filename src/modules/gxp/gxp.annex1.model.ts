// src/modules/gxp/gxp.annex1.model.ts
// Definicija strukture za podrobno obravnavo GxP Annex 1 točk.

export interface Annex1Lesson {
    id: number;
    title: string;
    annexReference: string; // Npr. "GxP Annex 1, 4.3"
    
    // 1. Razlaga in Razvoj (Teorija)
    developmentAndExplanation: string; 
    
    // 2. Primeri in Izzivi v Praksi (Aplikativni del)
    practicalChallenges: string;
    
    // 3. Ideje za Izboljšave (Digitalizacija, Aplikacija AI)
    improvementIdeas: string;
    
    // Dodatni vizualni vložki (za 3D, grafe, animacije)
    visualComponent: 'Diagram' | '3D-Airflow' | 'Quiz' | 'Simulation' | 'None';
    
    // Za preizkus znanja
    quizQuestions?: QuizQuestion[]; 
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number; 
    explanation: string;
}

// Opomba: Dejanski podatki o lekcijah bodo shranjeni v ločeni datoteki (npr. gxp.annex1.data.ts)