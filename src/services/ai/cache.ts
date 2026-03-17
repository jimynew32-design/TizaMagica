/**
 * PlanX System — Caché de respuestas IA
 * Resuelve: H-021
 *
 * Map en memoria con TTL configurable.
 * Key = hash(systemPrompt + userPrompt), Value = respuesta parseada.
 * Evita llamadas duplicadas idénticas y reduce costos de tokens.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Genera un hash simple para usar como cache key.
 * Usa Web Crypto API cuando disponible, fallback a DJB2.
 */
async function hashKey(input: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        // Fallback: DJB2 hash
        let hash = 5381;
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) + hash) + input.charCodeAt(i);
        }
        return Math.abs(hash).toString(36);
    }
}

/**
 * Busca en caché. Retorna el dato si existe y no expiró, o null.
 */
export async function getFromCache<T>(systemPrompt: string, userPrompt: string): Promise<T | null> {
    const key = await hashKey(systemPrompt + userPrompt);
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    if (import.meta.env.DEV) {
        console.log(`[Cache IA] HIT — ${key.substring(0, 12)}...`);
    }

    return entry.data;
}

/**
 * Guarda en caché con TTL.
 */
export async function setInCache<T>(
    systemPrompt: string,
    userPrompt: string,
    data: T,
    ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
    const key = await hashKey(systemPrompt + userPrompt);
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });

    if (import.meta.env.DEV) {
        console.log(`[Cache IA] SET — ${key.substring(0, 12)}... TTL: ${ttlMs / 1000}s. Total entries: ${cache.size}`);
    }
}

/**
 * Limpia toda la caché (ej: al cerrar sesión).
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Limpia entradas expiradas. Llamar periódicamente si la app vive mucho tiempo.
 */
export function purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
            cache.delete(key);
        }
    }
}
