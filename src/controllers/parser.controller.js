const { z } = require('zod');
const pdfParse = require('pdf-parse');
const { parsePatternWithLLM } = require('../services/llm.service');

const MAX_TEXT_LENGTH = 15000;
const FETCH_TIMEOUT_MS = 10000;

const parserSchema = z.object({
  inputType: z.enum(['text', 'url']),
  content: z.string().min(6, 'Provide at least a few characters or a valid URL'),
  title: z.string().max(120).optional()
});

const pdfSchema = z.object({
  data: z.string().min(10, 'PDF data is required (base64 string)'),
  filename: z.string().optional(),
  title: z.string().max(120).optional()
});

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const looksLikePdf = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (trimmed.startsWith('%PDF')) return true; // raw PDF header
  if (/^JVBER/i.test(trimmed)) return true; // base64 for %PDF
  if (trimmed.startsWith('data:application/pdf')) return true; // data URI
  return false;
};

const stripHtml = (html) => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

  const withLineBreaks = withoutScripts
    .replace(/<(br|p|div|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');

  return withLineBreaks.replace(/<[^>]+>/g, ' ').replace(/\s+\n/g, '\n').replace(/\n{2,}/g, '\n');
};

const fetchTextFromUrl = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CrochetCompanion/1.0 (pattern parser)',
        Accept: 'text/html,text/plain'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status} ${response.statusText})`);
    }

    const html = await response.text();
    const text = stripHtml(html);
    const normalized = normalizeWhitespace(text);
    return normalized.slice(0, MAX_TEXT_LENGTH);
  } finally {
    clearTimeout(timer);
  }
};

const parsePattern = async (req, res, next) => {
  try {
    const parsed = parserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { inputType, content, title } = parsed.data;

    if (looksLikePdf(content)) {
      return res
        .status(400)
        .json({ message: 'PDF detected. Use the PDF upload flow so we can extract text before parsing.' });
    }

    let sourceText = content;
    let sourceUrl;

    if (inputType === 'url') {
      try {
        sourceUrl = content;
        sourceText = await fetchTextFromUrl(content);
      } catch (error) {
        return res.status(400).json({ message: error.message || 'Unable to read from the provided URL.' });
      }
    }

    if (!sourceText || normalizeWhitespace(sourceText).length < 6) {
      return res.status(400).json({ message: 'No readable pattern content was found.' });
    }

    const truncated = normalizeWhitespace(sourceText).slice(0, MAX_TEXT_LENGTH);

    const result = await parsePatternWithLLM({
      text: truncated,
      meta: { sourceType: inputType, title, sourceUrl }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const parsePatternPdf = async (req, res, next) => {
  try {
    const parsed = pdfSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { data, filename, title } = parsed.data;
    let text;
    try {
      const buffer = Buffer.from(data, 'base64');
      const { text: extracted } = await pdfParse(buffer);
      text = normalizeWhitespace(extracted || '');
    } catch (err) {
      return res.status(400).json({ message: 'Unable to read PDF. Ensure it is a valid PDF file.' });
    }

    if (!text || text.length < 6) {
      return res.status(400).json({ message: 'No readable text found in the PDF.' });
    }

    const truncated = text.slice(0, MAX_TEXT_LENGTH);

    const result = await parsePatternWithLLM({
      text: truncated,
      meta: { sourceType: 'pdf', title: title || filename || null, sourceUrl: null }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  parsePattern,
  parsePatternPdf
};
