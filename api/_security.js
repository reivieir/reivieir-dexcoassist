const requestLog = new Map();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

export function prepareApiResponse(res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
}

function getClientKey(req) {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : String(forwardedFor || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

    return `${req.url || 'api'}:${ip}`;
}

function isRateLimited(req, now = Date.now()) {
    const key = getClientKey(req);
    const current = requestLog.get(key);

    if (!current || now - current.startedAt >= DEFAULT_WINDOW_MS) {
        requestLog.set(key, { count: 1, startedAt: now });
        return false;
    }

    current.count += 1;
    return current.count > DEFAULT_MAX_REQUESTS;
}

function isSameOrigin(req) {
    const origin = req.headers?.origin;
    if (!origin) return true;

    const forwardedHost = req.headers?.['x-forwarded-host'];
    const host = Array.isArray(forwardedHost)
        ? forwardedHost[0]
        : (forwardedHost || req.headers?.host);

    if (!host) return false;

    try {
        return new URL(origin).host === String(host).split(',')[0].trim();
    } catch {
        return false;
    }
}

export function validateApiRequest(req, res) {
    prepareApiResponse(res);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Método não permitido.' });
        return false;
    }

    const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
        res.status(415).json({ error: 'Envie o conteúdo no formato JSON.' });
        return false;
    }

    if (!isSameOrigin(req)) {
        res.status(403).json({ error: 'Origem não autorizada.' });
        return false;
    }

    if (isRateLimited(req)) {
        res.setHeader('Retry-After', '60');
        res.status(429).json({ error: 'Muitas solicitações. Aguarde um minuto e tente novamente.' });
        return false;
    }

    return true;
}

export function validateHistory(history, { allowImages = false } = {}) {
    if (!Array.isArray(history) || history.length === 0 || history.length > 30) {
        throw new RequestValidationError('Histórico de conversa inválido.');
    }

    return history.map((message) => {
        if (!message || !['user', 'model'].includes(message.role)) {
            throw new RequestValidationError('Mensagem com papel inválido.');
        }

        const text = typeof message.text === 'string' ? message.text.trim() : '';
        if (text.length > 6_000) {
            throw new RequestValidationError('Mensagem muito longa.');
        }

        const parts = [];
        if (text) parts.push({ text });

        if (allowImages && message.image) {
            const mimeType = String(message.image.mimeType || '');
            const data = String(message.image.data || '');
            const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

            if (!allowedMimeTypes.has(mimeType) || !/^[A-Za-z0-9+/=]+$/.test(data)) {
                throw new RequestValidationError('Imagem inválida.');
            }

            if (data.length > 4_000_000) {
                throw new RequestValidationError('Imagem muito grande.');
            }

            parts.push({ inlineData: { mimeType, data } });
        }

        if (parts.length === 0) {
            throw new RequestValidationError('Mensagem vazia.');
        }

        return { role: message.role, parts };
    });
}

export function validateText(value, fieldName, maxLength) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new RequestValidationError(`${fieldName} é obrigatório.`);
    }

    const normalized = value.trim();
    if (normalized.length > maxLength) {
        throw new RequestValidationError(`${fieldName} excede o tamanho permitido.`);
    }

    return normalized;
}

export async function fetchWithTimeout(url, options, timeoutMs = 20_000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

export function extractGeminiReply(data) {
    const reply = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || '')
        .join('')
        .trim();

    if (!reply) throw new Error('Resposta vazia do provedor de IA.');
    return reply;
}

export class RequestValidationError extends Error {}

export function sendApiError(res, error, context) {
    if (error instanceof RequestValidationError) {
        return res.status(400).json({ error: error.message });
    }

    console.error(`[${context}]`, error);
    return res.status(500).json({ error: 'Não foi possível processar a solicitação.' });
}
