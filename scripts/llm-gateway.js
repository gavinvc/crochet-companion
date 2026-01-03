require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const PORT = Number(process.env.LLM_GATEWAY_PORT) || 5051;
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const REQUEST_TIMEOUT_MS = Number(process.env.LLM_GATEWAY_TIMEOUT_MS) || 45000;

const app = express();
const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    upstream: OLLAMA_URL,
    model: OLLAMA_MODEL,
    timestamp: new Date().toISOString()
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    const body = {
      model: req.body.model || OLLAMA_MODEL,
      messages,
      stream: false,
      temperature: req.body.temperature ?? 0.2,
      max_tokens: req.body.max_tokens ?? 768,
      response_format: req.body.response_format || { type: 'json_object' }
    };

    const url = `${OLLAMA_URL}/v1/chat/completions`;
    console.info(`[llm-gateway] -> ${url} model=${body.model}`);

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).type('text/plain').send(text || `Upstream error ${upstream.status}`);
    }

    res.status(200).type('application/json').send(text);
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    const message = aborted ? `Gateway timeout after ${REQUEST_TIMEOUT_MS}ms` : error.message;
    console.error('[llm-gateway] error', message);
    res.status(500).json({ message });
  } finally {
    clearTimeout(timer);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`[llm-gateway] listening on http://localhost:${PORT} -> ${OLLAMA_URL}`);
});
