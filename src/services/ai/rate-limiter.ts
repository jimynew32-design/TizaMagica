/**
 * PlanX System — Rate Limiter para llamadas de IA
 * Resuelve: H-018
 *
 * Implementa:
 * - Semáforo de concurrencia (máx. 2 llamadas simultáneas)
 * - Exponential backoff con jitter para errores 429/5xx
 * - Circuit breaker tras 5 errores consecutivos
 */

const MAX_CONCURRENT = 2;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

let activeRequests = 0;
const queue: Array<() => void> = [];
let consecutiveErrors = 0;
let circuitOpenUntil = 0;

function acquireSlot(): Promise<void> {
    if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        queue.push(() => {
            activeRequests++;
            resolve();
        });
    });
}

function releaseSlot(): void {
    activeRequests--;
    if (queue.length > 0) {
        const next = queue.shift();
        next?.();
    }
}

function isCircuitOpen(): boolean {
    if (Date.now() < circuitOpenUntil) return true;
    if (circuitOpenUntil > 0 && Date.now() >= circuitOpenUntil) {
        // Half-open: reset and allow one request through
        circuitOpenUntil = 0;
        consecutiveErrors = 0;
    }
    return false;
}

function recordSuccess(): void {
    consecutiveErrors = 0;
}

function recordError(): void {
    consecutiveErrors++;
    if (consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_RESET_MS;
        if (import.meta.env.DEV) {
            console.warn(`[Rate Limiter] Circuit breaker ABIERTO por ${CIRCUIT_BREAKER_RESET_MS / 1000}s tras ${consecutiveErrors} errores consecutivos.`);
        }
    }
}

function getBackoffDelay(attempt: number): number {
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    const jitter = Math.random() * delay * 0.3; // 30% jitter
    return delay + jitter;
}

/**
 * Ejecuta una función con rate limiting, backoff y circuit breaker.
 */
export async function withRateLimiter<T>(
    fn: () => Promise<T>,
    label = 'IA'
): Promise<T> {
    if (isCircuitOpen()) {
        throw new Error(
            `El servicio de IA está temporalmente suspendido tras múltiples errores. ` +
            `Se reactivará automáticamente en unos segundos. Intenta de nuevo más tarde.`
        );
    }

    await acquireSlot();

    try {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await fn();
                recordSuccess();
                return result;
            } catch (error: any) {
                lastError = error;
                const isRetryable =
                    error.message?.includes('429') ||
                    error.message?.includes('503') ||
                    error.message?.includes('500') ||
                    error.message?.includes('rate');

                if (!isRetryable || attempt === MAX_RETRIES) {
                    recordError();
                    throw error;
                }

                const delay = getBackoffDelay(attempt);
                if (import.meta.env.DEV) {
                    console.warn(`[Rate Limiter] ${label} retry #${attempt + 1} en ${Math.round(delay)}ms`);
                }
                await new Promise((r) => setTimeout(r, delay));
            }
        }

        recordError();
        throw lastError || new Error('Rate limiter: reintentos agotados');
    } finally {
        releaseSlot();
    }
}
