import {
    extractGeminiReply,
    fetchWithTimeout,
    sendApiError,
    validateApiRequest,
    validateText,
} from './_security.js';

export default async function handler(req, res) {
    if (!validateApiRequest(req, res)) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[chat-caixa] GEMINI_API_KEY não configurada.');
        return res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    }

    try {
        const prompt = validateText(req.body?.prompt, 'Pergunta', 6_000);
        const contexto = validateText(req.body?.contexto, 'Contexto', 80_000);
        const promptCompleto = `CONTEXTO DO SISTEMA:\n${contexto}\n\nPERGUNTA DO USUÁRIO:\n${prompt}`;

        const response = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptCompleto }] }],
                    generationConfig: { temperature: 0.2 },
                }),
            },
        );

        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(`Gemini respondeu com status ${response.status}.`);
        }

        return res.status(200).json({ reply: extractGeminiReply(data) });
    } catch (error) {
        return sendApiError(res, error, 'chat-caixa');
    }
}
