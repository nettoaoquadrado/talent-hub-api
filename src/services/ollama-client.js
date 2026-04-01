const config = require('../config/config');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || config.ollama?.baseUrl || 'http://localhost:11434';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';

function formatFetchError(err) {
  const msg = err.message || 'unknown';
  const cause = err.cause?.code || err.cause?.message || err.code;
  if (cause) return `${msg} (${cause})`;
  return msg;
}

async function generate(prompt, maxTokens = 300) {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        prompt,
        stream: false,
        options: { num_predict: maxTokens },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response?.trim() || null;
  } catch (err) {
    const detail = formatFetchError(err);
    console.warn('[ollama-client] generate error:', detail);
    console.warn(
      '[ollama-client] OLLAMA_BASE_URL=',
      OLLAMA_BASE_URL,
      '- verifique se o Ollama está rodando e acessível.'
    );
    return null;
  }
}

async function embed(text) {
  if (!text || !String(text).trim()) return null;
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: String(text).trim() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.embedding) ? data.embedding : null;
  } catch (err) {
    const detail = formatFetchError(err);
    console.warn('[ollama-client] embed error:', detail);
    console.warn('[ollama-client] OLLAMA_BASE_URL=', OLLAMA_BASE_URL);
    return null;
  }
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const den = Math.sqrt(normA) * Math.sqrt(normB);
  return den === 0 ? 0 : Math.max(0, Math.min(1, dot / den));
}

module.exports = {
  generate,
  embed,
  cosineSimilarity,
};
