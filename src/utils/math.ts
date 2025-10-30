// src/utils/math.ts
// Univerzalne matematične funkcije.

/**
 * Pomožna funkcija za zaokroževanje števila. 
 */
export const round = (value: number, decimals: number = 2): number => {
    if (isNaN(value) || value === null || !isFinite(value)) {
        return 0; 
    }
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}