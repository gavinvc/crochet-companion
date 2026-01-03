const { z } = require('zod');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const rowSchema = z.object({
  rowNumber: z.number().optional(),
  instruction: z.string(),
  stitches: z.array(z.string()).optional().default([]),
  notes: z.string().optional()
});

const llmResponseSchema = z.object({
  rows: z.array(rowSchema),
  summary: z.string().optional().default(''),
  warnings: z.array(z.string()).optional().default([])
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
      'Each row must include rowNumber (int), instruction (plain-language, concise), stitches (array of stitch names), and optional notes.',
      'Expand shorthand repeats into clear wording but keep stitch counts.',
      'If information is missing, make a best-effort guess and add a warning.',
      'Limit to 200 rows and keep instructions actionable.'
    ].join(' '),
    user: `${intro}\n\nRaw pattern:\n${text}`
  };
};

const normalizeRows = (rows) => {
  return rows
    .map((row, index) => ({
      rowNumber: Number.isFinite(row.rowNumber) ? row.rowNumber : index + 1,
      instruction: row.instruction?.trim() || '',
      stitches: Array.isArray(row.stitches) ? row.stitches.map(item => String(item).trim()).filter(Boolean) : [],
      notes: row.notes?.trim() || undefined
    }))
    .filter(row => row.instruction.length > 0);
};

const parsePatternWithLLM = async ({ text, meta }) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Add it to your environment to enable pattern parsing.');
  }

  const { system, user } = buildPrompt(text, meta);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM response did not include content.');
  }

  const parsedJson = llmResponseSchema.parse(JSON.parse(content));
  const rows = normalizeRows(parsedJson.rows);

  return {
    rows,
    summary: parsedJson.summary,
    warnings: parsedJson.warnings,
    sourceType: meta.sourceType,
    sourceTitle: meta.title || null,
    rawExcerpt: text.slice(0, 4000)
  };
};

module.exports = {
  parsePatternWithLLM
};
