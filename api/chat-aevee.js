import fs from 'fs';
import path from 'path';
import {
    extractGeminiReply,
    fetchWithTimeout,
    sendApiError,
    validateApiRequest,
    validateHistory,
} from './_security.js';

export const config = {
    api: {
        bodyParser: { sizeLimit: '4mb' },
    },
};

export default async function handler(req, res) {
    if (!validateApiRequest(req, res)) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[chat-aevee] GEMINI_API_KEY não configurada.');
        return res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    }

    try {
        const contents = validateHistory(req.body?.history, { allowImages: true });
        const filePath = path.join(process.cwd(), 'conhecimento.txt');
        const baseDeConhecimento = fs.readFileSync(filePath, 'utf8');

        const response = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: baseDeConhecimento }] },
                    contents,
                }),
            },
        );

        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(`Gemini respondeu com status ${response.status}.`);
        }

        return res.status(200).json({ reply: extractGeminiReply(data) });
    } catch (error) {
        return sendApiError(res, error, 'chat-aevee');
    }
}
