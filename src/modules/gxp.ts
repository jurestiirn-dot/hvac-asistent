// src/modules/gxp.ts (POPOLNOMA POPRAVLJENA LOGIKA ZA GxP)

// KLJUČNO: Uvozimo DOM funkcije iz dveh nivojev nazaj (src/modules/ -> src/)
import { DOM, findDOM } from '../utils/dom'; 
import type { Annex1Lesson, QuizQuestion } from './gxp/gxp.annex1.model';
import { Annex1Content } from './gxp/gxp.annex1.data';


// --- MAPPING ELEMENTOV ---
const gxpDOM = {
    gxpSidebar: '#gxp-sidebar',
    gxpContent: '#gxp-content',
    lessonTitle: '#lesson-title',
    lessonReference: '#lesson-reference',
    devExplanation: '#dev-explanation',
    practicalChallenges: '#practical-challenges',
    improvementIdeas: '#improvement-ideas',
    visualOrQuizArea: '#visual-or-quiz-area'
};
// ... (ostala logika funkcij renderSidebar, loadLesson, renderQuizOrVisual, renderQuiz, checkQuizAnswers) ostane enaka, kot smo jo popravljali zadnjič, saj so tipi zdaj urejeni)

function renderSidebar(): void {
    if (!DOM.gxpSidebar) return;
    
    const sidebar = DOM.gxpSidebar as HTMLElement;
    sidebar.innerHTML = '<h2>Lekcije</h2>'; 
    
    Annex1Content.forEach(lesson => {
        const button = document.createElement('button');
        button.className = 'gxp-lesson-btn';
        button.textContent = lesson.title;
        button.dataset.lessonId = lesson.id.toString();
        
        button.addEventListener('click', (e: Event) => {
            const btn = e.currentTarget as HTMLElement;
            const lessonId = parseInt(btn.dataset.lessonId || '0');
            
            loadLesson(lessonId);
            document.querySelectorAll('.gxp-lesson-btn').forEach(btn => btn.classList.remove('active'));
            btn.classList.add('active');
        });
        
        sidebar.appendChild(button);
    });
    
    if (Annex1Content.length > 0) {
        loadLesson(Annex1Content[0].id);
        const firstButton = sidebar.querySelector('.gxp-lesson-btn');
        if (firstButton) firstButton.classList.add('active');
    }
}

function loadLesson(lessonId: number): void {
    const lesson = Annex1Content.find(l => l.id === lessonId);
    if (!lesson) return;
    
    if (DOM.lessonTitle) DOM.lessonTitle.textContent = lesson.title;
    if (DOM.lessonReference) DOM.lessonReference.textContent = lesson.annexReference;
    if (DOM.devExplanation) DOM.devExplanation.textContent = lesson.developmentAndExplanation;
    if (DOM.practicalChallenges) DOM.practicalChallenges.textContent = lesson.practicalChallenges;
    if (DOM.improvementIdeas) DOM.improvementIdeas.textContent = lesson.improvementIdeas;
    
    renderQuizOrVisual(lesson);
}

function renderQuizOrVisual(lesson: Annex1Lesson): void {
    if (!DOM.visualOrQuizArea) return;
    
    const container = DOM.visualOrQuizArea as HTMLElement;
    container.innerHTML = ''; 
    
    if (lesson.quizQuestions && lesson.quizQuestions.length > 0) {
        container.innerHTML = '<h3>4. Preizkus Znanja (Kviz)</h3>';
        renderQuiz(lesson.quizQuestions, container);
    } else {
        container.innerHTML = `
            <h3>4. Vizualizacija / Simulacija (${lesson.visualComponent})</h3>
            <p class="result-status info">Tukaj bo integriran interaktiven ${lesson.visualComponent} model (Three.js), ki bo ponazarjal to teorijo. Trenutno v razvoju.</p>
        `;
    }
}

function renderQuiz(questions: QuizQuestion[], container: HTMLElement): void {
    let quizHTML = '';
    
    questions.forEach((q: QuizQuestion, qIndex: number) => { 
        quizHTML += `<div class="quiz-question" data-q-index="${qIndex}">
            <h4>Vprašanje ${qIndex + 1}: ${q.question}</h4>
            <div class="quiz-options">`;
            
        q.options.forEach((option: string, oIndex: number) => { 
            quizHTML += `
                <div class="quiz-option">
                    <input type="radio" id="q${qIndex}o${oIndex}" name="question${qIndex}" value="${oIndex}">
                    <label for="q${qIndex}o${oIndex}">${option}</label>
                </div>`;
        });
        
        quizHTML += `</div>
            <p class="quiz-feedback hidden"></p>
        </div>`;
    });
    
    quizHTML += `<button id="submit-quiz-btn" class="button primary">Oddaj Odgovore in Preveri</button>`;
    
    const quizWrapper = document.createElement('div');
    quizWrapper.innerHTML = quizHTML;
    container.appendChild(quizWrapper);
    
    document.getElementById('submit-quiz-btn')?.addEventListener('click', () => checkQuizAnswers(questions));
}


function checkQuizAnswers(questions: QuizQuestion[]): void { 
    let correctCount = 0;
    const totalQuestions = questions.length;
    
    questions.forEach((q: QuizQuestion, qIndex: number) => { 
        const questionDiv = document.querySelector(`.quiz-question[data-q-index="${qIndex}"]`);
        const feedbackEl = questionDiv?.querySelector('.quiz-feedback');
        
        const selectedOption = document.querySelector(`input[name="question${qIndex}"]:checked`) as HTMLInputElement | null; 
        
        if (feedbackEl) {
            feedbackEl.classList.remove('hidden', 'success', 'error', 'warning');
            
            if (selectedOption) {
                const selectedIndex = parseInt(selectedOption.value);
                if (selectedIndex === q.correctAnswerIndex) {
                    correctCount++;
                    feedbackEl.textContent = 'Pravilno! ' + q.explanation;
                    feedbackEl.classList.add('success');
                } else {
                    feedbackEl.textContent = `Napačno. Pravilni odgovor je ${q.options[q.correctAnswerIndex]}. ${q.explanation}`;
                    feedbackEl.classList.add('error');
                }
            } else {
                 feedbackEl.textContent = 'Prosimo, izberite odgovor.';
                 feedbackEl.classList.add('warning');
            }
        }
    });

    const finalStatusEl = document.createElement('h3');
    finalStatusEl.innerHTML = `Končni Rezultat: ${correctCount} / ${totalQuestions} Pravilnih Odgovorov.`;
    finalStatusEl.className = 'result-status ' + (correctCount === totalQuestions ? 'success' : 'warning');
    
    const existingStatus = document.getElementById('quiz-final-status');
    if (existingStatus) existingStatus.remove();
    
    finalStatusEl.id = 'quiz-final-status';
    document.getElementById('submit-quiz-btn')?.insertAdjacentElement('afterend', finalStatusEl);
}


export function initGxpModule(): void {
    findDOM(gxpDOM, 'gxp'); 
    renderSidebar();
}