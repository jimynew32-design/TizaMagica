/**
 * PlanX System — Utilidad de Encriptación
 * AES-256-GCM con Web Crypto API nativa (sin dependencias)
 * 
 * Formato de salida: base64(salt):base64(iv):base64(ciphertext)
 */

const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/** Deriva una clave AES-256 desde una passphrase usando PBKDF2 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/** Convierte ArrayBuffer o Uint8Array a string Base64 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
}

/** Convierte string Base64 a Uint8Array */
function base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encripta texto plano con AES-256-GCM.
 * @param plainText - Texto a encriptar
 * @param passphrase - Clave secreta (ej: userId/DNI)
 * @returns String formato "salt:iv:ciphertext" en Base64
 */
export async function encrypt(plainText: string, passphrase: string): Promise<string> {
    if (!plainText) return '';

    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(passphrase, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        encoder.encode(plainText)
    );

    return `${bufferToBase64(salt)}:${bufferToBase64(iv)}:${bufferToBase64(encrypted)}`;
}

/**
 * Desencripta texto cifrado con AES-256-GCM.
 * @param cipherText - String formato "salt:iv:ciphertext" en Base64
 * @param passphrase - Clave secreta (misma usada para encriptar)
 * @returns Texto plano original
 */
export async function decrypt(cipherText: string, passphrase: string): Promise<string> {
    if (!cipherText || !cipherText.includes(':')) return cipherText;

    try {
        const [saltB64, ivB64, dataB64] = cipherText.split(':');
        const salt = base64ToBuffer(saltB64);
        const iv = base64ToBuffer(ivB64);
        const data = base64ToBuffer(dataB64);
        const key = await deriveKey(passphrase, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv as BufferSource },
            key,
            data as BufferSource
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        // H-028 Fix: No retornar silenciosamente el ciphertext como plaintext
        if (import.meta.env.DEV) {
            console.warn('Crypto: Desencriptación fallida. Posible texto plano legado o passphrase incorrecta.');
        }
        return '';
    }
}

/**
 * Detecta si un string parece estar encriptado (formato salt:iv:data).
 */
export function isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    return parts.length === 3 && parts.every(p => p.length > 10);
}
