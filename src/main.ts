// src/main.ts (POPOLNOMA POPRAVLJENA KODA ZA ZAGON)

// Uvoz funkcij za DOM manipulacijo.
// Uporabimo relativno pot: ./utils/dom, ker je main.ts v src/ in dom.ts je v src/utils/
import { loadInputFromSession, saveInputToSession, findDOM, DOM } from './utils/dom'; 

// i18n (Slovenščina)
import { setLocale, t } from './utils/i18n';

// --- UVOZ GxP MODULA ---
import { initGxpModule } from './modules/gxp'; 

// --- MAPPING GLOBALNIH DOM ELEMENTOV ---
const globalDOMSelectors = {
    sidebar: '#sidebar',
    navLinks: ['a.nav-link'], 
    appWrapper: '#app-wrapper',
    dashboardView: '#dashboard-view',
    gxpView: '#gxp-view',
    converterView: '#converter-view', 
    calView: '#cal-view', 
};


/**
 * Funkcija za usmerjanje (Routing)
 */
function navigateTo(moduleName: string) {
    const allViews = document.querySelectorAll('.container');
    allViews.forEach(view => view.classList.add('hidden'));

    const targetView = DOM[`${moduleName}View`];
    if (targetView) {
        targetView.classList.remove('hidden');
    } else {
        DOM.dashboardView?.classList.remove('hidden');
    }
    
    window.location.hash = moduleName;

    const navLinks = document.querySelectorAll('a.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const htmlLink = link as HTMLElement; 
        if (htmlLink.dataset.module === moduleName) { 
            link.classList.add('active');
        }
    });
}

/**
 * Inicializacija aplikacije.
 */
function initApp() {
    // Nastavimo jezik aplikacije na slovenščino (minimalno i18n)
    setLocale('sl');
    // Nastavimo naslov strani iz prevoda
    document.title = t('app.title', 'HVAC Asistent');
    const appTitleEl = document.getElementById('app-title');
    if (appTitleEl) appTitleEl.textContent = t('app.title', 'HVAC Asistent');
    
    // 1. Mapiranje globalnih DOM elementov
    findDOM(globalDOMSelectors);

    // 2. Nastavitev poslušalcev za navigacijo
    document.querySelectorAll('a.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo((e.currentTarget as HTMLElement).dataset.module || 'dashboard');
        });
    });

    // 3. Pripni poslušalce za Session Storage
    document.querySelectorAll('.session-input').forEach(input => {
        input.addEventListener('input', saveInputToSession);
        input.addEventListener('change', saveInputToSession); 
    });

    // 4. Inicializacija GxP modula 
    initGxpModule(); 

    // 5. Naložitev podatkov in določitev view
    loadInputFromSession();
    const initialModule = window.location.hash.slice(1) || 'dashboard';
    navigateTo(initialModule);
}

document.addEventListener('DOMContentLoaded', initApp);