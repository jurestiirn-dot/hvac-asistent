// src/utils/dom.ts
// Funkcije za manipulacijo DOM in shranjevanje Session Storage.

// Globalni objekt za shranjevanje referenc na DOM elemente
export const DOM: { [key: string]: any } = {};

/**
 * Pomožna funkcija za iskanje in shranjevanje DOM elementov.
 */
export const findDOM = (selectors: { [key: string]: string | string[] }, prefix: string = '') => {
    for (const [key, selector] of Object.entries(selectors)) {
        const domKey = `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof selector === 'string') {
             DOM[domKey] = document.querySelector(selector);
        } else if (Array.isArray(selector)) {
             // Za selektorje, ki vrnejo več elementov
             DOM[domKey] = document.querySelectorAll(selector[0]);
        }
    }
};

/**
 * Preverjanje in shranjevanje v Session Storage
 */
export const saveInputToSession = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.id && input.type !== 'file') {
        sessionStorage.setItem(input.id, input.value);
    }
};

/**
 * Nalaganje podatkov iz Session Storage
 */
export const loadInputFromSession = () => {
    document.querySelectorAll('.session-input').forEach(input => {
        const htmlInput = input as HTMLInputElement;
        const value = sessionStorage.getItem(htmlInput.id);
        if (value !== null) {
            htmlInput.value = value;
            htmlInput.dispatchEvent(new Event('input')); 
        }
    });
};