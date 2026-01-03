const { z } = require('zod');

const PROVIDER = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();
// Allow larger patterns before clipping; capped below controller limit (15k).
const MAX_PROMPT_CHARS = 12000;

// Ollama (free, local-first)
const LLM_GATEWAY_URL = (process.env.LLM_GATEWAY_URL || 'http://localhost:5051').replace(/\/$/, '');
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_REQUEST_TIMEOUT_MS = 40000;

// Hugging Face (optional remote)
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL_ID = process.env.HF_MODEL || 'meta-llama/Llama-3.2-1B-Instruct';
const HF_INFERENCE_URL_BASE = 'https://router.huggingface.co/v1/chat/completions';
const HF_FALLBACK_GEN_URL_BASE = 'https://api-inference.huggingface.co/models';
const HF_MAX_RETRIES = 0;
const HF_REQUEST_TIMEOUT_MS = 20000;
const HF_FALLBACK_MODELS = [];

const rowSchema = z.object({
  rowNumber: z.number().optional(),
  instruction: z.string(),
  stitches: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional()
}).passthrough();

const llmResponseSchema = z.object({
  rows: z.array(rowSchema).optional().default([]),
  summary: z.string().optional().default(''),
  // Some models return objects for warnings; accept anything and clean later.
  warnings: z.array(z.any()).optional().default([])
});

const buildPrompt = (text, meta) => {
  const intro = [
    meta.title ? `Pattern title: ${meta.title}` : 'Pattern title: (not provided)',
    `Source type: ${meta.sourceType}`,
    meta.sourceUrl ? `Source URL: ${meta.sourceUrl}` : null,
    'Desired format: JSON with rows, summary, warnings.'
  ]
    .filter(Boolean)
    .join('\n');

  return {
    system: [
      'You are an expert crochet tech editor turning messy patterns into structured steps.',
      'Return strict JSON, do not include markdown. No prose before or after the JSON.',
      'Each row must include rowNumber (int), instruction (plain-language, complete), stitches (array of stitch names), and optional notes.',
      'Do not place warnings inside rows; warnings must go in the top-level warnings array only.',
      'Assume the input may be out of order due to copy/paste; read the entire text and produce a logically ordered, complete pattern.',
      'Ignore ads, marketing copy, author bio, comments, and any non-pattern sections. Focus only on the crochet pattern instructions and materials.',
      'If the text contains headers like "Kelli Bias Scarf Pattern", "Part", or "Row", treat those as the start of the instructions and prioritize everything from there onward.',
      'Each row must include the full start, middle, repeat-until-end behavior, and end-of-row action (e.g., turn/join/continue). Do not stop mid-row; include how the row ends.',
      'Expand shorthand or implied repeats into explicit instructions, including inferred repeat counts or "repeat to end" when language implies repetition (e.g., "* pattern * across", "repeat Row 2"), and state the end-of-row action. Do not leave rows hanging at "until last X sts"—finish the row explicitly.',
      'If any detail is missing, make a best-effort, concise guess for the complete row and record the assumption in warnings.',
      'Include a confidence note in warnings when confidence is below 0.8 (e.g., "Confidence ~0.65: inferred repeats and endings"), especially if the pattern may be incomplete.',
      'Limit to 200 rows and keep instructions actionable; no prose beyond the JSON.'
    ].join(' '),
    user: `${intro}\n\nRaw pattern:\n${text}`
  };
};

const normalizeRows = (rows) => {
  const sorted = [...rows].sort((a, b) => {
    const aNum = Number.isFinite(a?.rowNumber) ? a.rowNumber : Infinity;
    const bNum = Number.isFinite(b?.rowNumber) ? b.rowNumber : Infinity;
    if (aNum !== bNum) return aNum - bNum;
    return 0;
  });

  return sorted
    .map((row, index) => ({
      rowNumber: index + 1,
      instruction: row.instruction?.trim() || '',
      stitches: Array.isArray(row.stitches) ? row.stitches.map(item => String(item).trim()).filter(Boolean) : [],
      notes: typeof row.notes === 'string' ? row.notes.trim() || undefined : undefined
    }))
    .filter(row => row.instruction.length > 0);
};

const normalizeWarnings = (warnings) => {
  return (warnings || [])
    .map((w) => {
      if (typeof w === 'string') return w.trim();
      if (w && typeof w === 'object') {
        if (typeof w.message === 'string') return w.message.trim();
        try {
          return JSON.stringify(w);
        } catch (err) {
          return String(w);
        }
      }
      return String(w || '').trim();
    })
    .filter(Boolean);
};

const callOllamaChat = async ({ system, user }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_REQUEST_TIMEOUT_MS);

  try {
    const baseUrl = LLM_GATEWAY_URL || OLLAMA_URL;
    const url = `${baseUrl}/v1/chat/completions`;
    const body = {
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2,
      max_tokens: 768,
      stream: false,
      response_format: { type: 'json_object' }
    };

    console.info(`[llm] ollama request url=${url} model=${OLLAMA_MODEL}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText} - ${rawText}`);
    }

    return JSON.parse(rawText);
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    const msg = aborted ? `Ollama request timed out after ${OLLAMA_REQUEST_TIMEOUT_MS}ms` : error.message;
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }
};

const parsePatternWithLLM = async ({ text, meta }) => {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  if (text.trim().startsWith('%PDF')) {
    throw new Error('The provided content looks like a PDF file. Please supply extracted text instead of raw PDF bytes.');
  }

  const clipped = text.slice(0, MAX_PROMPT_CHARS);
  const wasClipped = text.length > MAX_PROMPT_CHARS;
  const { system, user } = buildPrompt(clipped, meta);

    const inferencePayload = {
      model: HF_MODEL_ID,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2,
      max_tokens: 768,
      stream: false,
      response_format: { type: 'json_object' }
    };

  const tryChatCall = async (modelId) => {
    let payload;
    let lastError;

    for (let attempt = 0; attempt <= HF_MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HF_REQUEST_TIMEOUT_MS);

      try {
        const requestBody = { ...inferencePayload, model: modelId };
        const url = HF_INFERENCE_URL_BASE;
        console.info(`[llm] hf request attempt=${attempt + 1} url=${url} model=${modelId}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${HF_TOKEN}`
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        const rawText = await response.text();

        if (response.ok) {
          try {
            payload = JSON.parse(rawText);
          } catch (parseErr) {
            lastError = `LLM response parse error (${modelId}): ${parseErr.message}. Raw: ${rawText}`;
            break;
          }
          lastError = undefined;
          console.info(`[llm] hf response attempt=${attempt + 1} model=${modelId} status=${response.status}`);
          break;
        }

        const snippet = rawText;
        const isHtml = /<html/i.test(snippet);
        lastError = `LLM request failed (${modelId}): ${response.status} ${response.statusText} - ${snippet}`;
        console.warn(`[llm] hf response attempt=${attempt + 1} model=${modelId} status=${response.status}`);

        if (response.status === 400 && /model_not_supported|not a chat model/i.test(snippet)) {
          break;
        }

        if ((response.status >= 500 || isHtml) && attempt < HF_MAX_RETRIES) {
          await sleep(600 * (attempt + 1) ** 1.2);
          continue;
        }

        break;
      } catch (error) {
        const aborted = error?.name === 'AbortError';
        lastError = aborted ? `LLM request timed out (${modelId}) after ${HF_REQUEST_TIMEOUT_MS}ms` : `LLM fetch error (${modelId}): ${error.message}`;
        console.warn(`[llm] hf request-error attempt=${attempt + 1} model=${modelId} error=${lastError}`);

        if (attempt < HF_MAX_RETRIES) {
          await sleep(600 * (attempt + 1) ** 1.2);
          continue;
        }
        break;
      } finally {
        clearTimeout(timer);
      }
    }

    return { payload, error: lastError };
  };

  const tryTextGenFallback = async (modelId) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HF_REQUEST_TIMEOUT_MS);
    let lastError;

    try {
      const url = `${HF_FALLBACK_GEN_URL_BASE}/${encodeURIComponent(modelId)}`;
      const prompt = `${inferencePayload.messages[0].content}\n\nUser:\n${inferencePayload.messages[1].content}\n\nAssistant:`;
      const body = {
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.2,
          return_full_text: false
        }
      };

      console.info(`[llm] hf fallback-request url=${url} model=${modelId}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const rawText = await response.text();
      if (!response.ok) {
        lastError = `LLM fallback failed (${modelId}): ${response.status} ${response.statusText} - ${rawText}`;
        return { payload: null, error: lastError };
      }

      try {
        const parsed = JSON.parse(rawText);
        return { payload: parsed, error: null };
      } catch (err) {
        lastError = `LLM fallback parse error (${modelId}): ${err.message} raw=${rawText}`;
        return { payload: null, error: lastError };
      }
    } catch (error) {
      const aborted = error?.name === 'AbortError';
      lastError = aborted ? `LLM fallback timed out (${modelId}) after ${HF_REQUEST_TIMEOUT_MS}ms` : `LLM fallback fetch error (${modelId}): ${error.message}`;
      return { payload: null, error: lastError };
    } finally {
      clearTimeout(timer);
    }
  };

  const runHuggingFace = async () => {
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN is not configured. Add it to your environment or switch LLM_PROVIDER=ollama.');
    }

    let payload;
    let lastError;
    const modelsToTry = [HF_MODEL_ID, ...HF_FALLBACK_MODELS];

    for (const modelId of modelsToTry) {
      const { payload: candidatePayload, error } = await tryChatCall(modelId);
      if (candidatePayload) {
        payload = candidatePayload;
        lastError = undefined;
        break;
      }
      lastError = error;

      const { payload: genPayload, error: genError } = await tryTextGenFallback(modelId);
      if (genPayload) {
        payload = genPayload;
        lastError = undefined;
        break;
      }
      lastError = genError;
    }

    if (!payload) {
      throw new Error(lastError || 'LLM request failed with no payload.');
    }

    return payload;
  };

  const runProvider = async () => {
    if (PROVIDER === 'ollama') {
      return callOllamaChat({ system, user });
    }

    if (PROVIDER === 'hf' || PROVIDER === 'huggingface') {
      return runHuggingFace();
    }

    throw new Error(`Unsupported LLM_PROVIDER "${PROVIDER}". Use 'ollama' or 'huggingface'.`);
  };

  const payload = await runProvider();

  const extractGeneratedText = (data) => {
    if (!data) return null;
    const chatContent = data?.choices?.[0]?.message?.content;
    if (typeof chatContent === 'string') return chatContent;

    if (Array.isArray(data)) {
      const candidate = data.find(item => typeof item?.generated_text === 'string') || data[0];
      return candidate?.generated_text || candidate?.text || null;
    }
    if (typeof data?.generated_text === 'string') return data.generated_text;
    if (typeof data?.text === 'string') return data.text;
    return null;
  };

  let content = extractGeneratedText(payload);

  if (!content) {
    throw new Error('LLM response did not include generated text.');
  }

  content = content.trim();

  const extractBalancedJson = (str) => {
    const start = str.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < str.length; i += 1) {
      const ch = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
      if (depth === 0) {
        return str.slice(start, i + 1);
      }
    }
    return null;
  };

  const balanced = extractBalancedJson(content);
  if (balanced) {
    content = balanced;
  } else {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      content = content.slice(jsonStart, jsonEnd + 1);
    }
  }

  const tryParseJson = (raw) => {
    const attempt = (str) => {
      try {
        return JSON.parse(str);
      } catch (err) {
        return null;
      }
    };

    const cleaned = raw
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const removeTrailingCommas = (str) => str.replace(/,\s*([}\]])/g, '$1');

    const removeDanglingCommas = (str) => str.replace(/,\s*(\]|\})/g, '$1');

    const rebalanceDelimiters = (str) => {
      const openBraces = (str.match(/{/g) || []).length;
      const closeBraces = (str.match(/}/g) || []).length;
      const openBrackets = (str.match(/\[/g) || []).length;
      const closeBrackets = (str.match(/\]/g) || []).length;
      let patched = str;
      if (openBraces > closeBraces) patched += '}'.repeat(openBraces - closeBraces);
      if (openBrackets > closeBrackets) patched += ']'.repeat(openBrackets - closeBrackets);
      return patched;
    };

    const dropUnmatchedQuoteTail = (str) => {
      const quoteCount = (str.match(/"/g) || []).length;
      if (quoteCount % 2 === 0) return str;
      const lastQuote = str.lastIndexOf('"');
      return lastQuote !== -1 ? str.slice(0, lastQuote) : str;
    };

    const trimAfterLastBrace = (str) => {
      const lastBrace = str.lastIndexOf('}');
      return lastBrace !== -1 ? str.slice(0, lastBrace + 1) : str;
    };

    const trimAfterLastBracketOrBrace = (str) => {
      const lastBrace = str.lastIndexOf('}');
      const lastBracket = str.lastIndexOf(']');
      const cut = Math.max(lastBrace, lastBracket);
      return cut !== -1 ? str.slice(0, cut + 1) : str;
    };

    const longestBalancedPrefix = (str) => {
      const start = str.indexOf('{');
      if (start === -1) return null;
      let depth = 0;
      let inString = false;
      let escape = false;
      let lastGood = -1;
      for (let i = start; i < str.length; i += 1) {
        const ch = str[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{' || ch === '[') depth += 1;
        if (ch === '}' || ch === ']') depth -= 1;
        if (depth === 0) lastGood = i;
      }
      if (lastGood !== -1) return str.slice(start, lastGood + 1);
      if (depth > 0) {
        // Append missing closers for best-effort recovery
        return str.slice(start) + '}'.repeat(depth);
      }
      return null;
    };

    const appendMissingClosers = (str) => {
      const openBraces = (str.match(/{/g) || []).length;
      const closeBraces = (str.match(/}/g) || []).length;
      const openBrackets = (str.match(/\[/g) || []).length;
      const closeBrackets = (str.match(/\]/g) || []).length;
      let patched = str;
      if (openBraces > closeBraces) patched += '}'.repeat(openBraces - closeBraces);
      if (openBrackets > closeBrackets) patched += ']'.repeat(openBrackets - closeBrackets);
      return patched;
    };

    const candidates = [
      raw.trim(),
      cleaned,
      removeTrailingCommas(cleaned),
      rebalanceDelimiters(removeTrailingCommas(cleaned)),
      rebalanceDelimiters(cleaned),
      rebalanceDelimiters(dropUnmatchedQuoteTail(cleaned)),
      rebalanceDelimiters(trimAfterLastBrace(cleaned)),
      rebalanceDelimiters(removeDanglingCommas(cleaned)),
      longestBalancedPrefix(cleaned),
      trimAfterLastBrace(cleaned),
      trimAfterLastBracketOrBrace(cleaned),
      rebalanceDelimiters(trimAfterLastBracketOrBrace(cleaned)),
      appendMissingClosers(cleaned)
    ].filter(Boolean);

    for (const candidate of candidates) {
      const parsed = attempt(candidate);
      if (parsed) return parsed;
    }
    return null;
  };

  const parsed = tryParseJson(content);
  const salvageRowsObject = () => {
    const rowsIdx = content.indexOf('"rows"');
    if (rowsIdx === -1) return null;
    const arrayStart = content.indexOf('[', rowsIdx);
    if (arrayStart === -1) return null;
    let body = content.slice(arrayStart);
    const lastObjClose = body.lastIndexOf('}');
    if (lastObjClose !== -1) {
      body = body.slice(0, lastObjClose + 1);
    }
    if (!body.trim().endsWith(']')) {
      body = body.replace(/\s*$/, '');
      body = `${body}]`;
    }
    const candidate = `{"rows":${body}}`;
    try {
      return JSON.parse(candidate);
    } catch (err) {
      return null;
    }
  };

  const parsedOrSalvaged = parsed || salvageRowsObject();

  if (!parsedOrSalvaged) {
    console.warn('[llm] parse failure; raw content length', content.length);
    console.error('[llm] parse failure raw content BEGIN');
    console.error(content);
    console.error('[llm] parse failure raw content END');
    throw new Error(`LLM returned non-JSON content. First 1200 chars: ${content.slice(0, 1200)}`);
  }

  // Some models wrap inside { pattern: { rows, ... } }
  const parsedRoot = parsedOrSalvaged?.pattern && !parsedOrSalvaged.rows ? parsedOrSalvaged.pattern : parsedOrSalvaged;

  const parsedJson = llmResponseSchema.parse(parsedRoot);
  const rows = normalizeRows(parsedJson.rows);
  const warnings = normalizeWarnings(parsedJson.warnings);
  if (rows.length === 0) {
    warnings.push('LLM response contained no rows; please retry or ensure the model has the correct prompt context.');
  }
  if (wasClipped) {
    warnings.push(`Input truncated to ${MAX_PROMPT_CHARS} characters; output may be partial.`);
  }

  return {
    rows,
    summary: parsedJson.summary,
    warnings,
    sourceType: meta.sourceType,
    sourceTitle: meta.title || null,
    rawExcerpt: text.slice(0, 4000)
  };
};

module.exports = {
  parsePatternWithLLM
};
